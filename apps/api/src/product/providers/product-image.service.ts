import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ActiveUserDto } from '../../auth/dtos/active-user.dto.js';
import {
  StoredFilePurpose,
  StoredFileStatus,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PermissionProvider } from '../../user/providers/permission.provider.js';
import { UserService } from '../../user/providers/user.service.js';
import { StorageService } from '../../storage/storage.service.js';
import { UPLOAD_EXPIRY_SECONDS } from '../../storage/storage.constants.js';
import { AttachProductImageDto } from '../dtos/attach-product-image.dto.js';
import { PresignProductImageDto } from '../dtos/presign-product-image.dto.js';

@Injectable()
export class ProductImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly permission: PermissionProvider,
    private readonly users: UserService,
  ) {}

  async presign(dto: PresignProductImageDto, activeUser: ActiveUserDto) {
    const actor = await this.requireManager(activeUser.sub);
    if (dto.purpose !== StoredFilePurpose.PRODUCT) {
      throw new BadRequestException('Purpose must be PRODUCT');
    }
    const id = randomUUID();
    const originalName = this.normalizeOriginalName(dto.fileName);
    const objectKey = this.storage.buildKey({
      purpose: dto.purpose,
      fileId: id,
      fileName: originalName,
      mimeType: dto.mimeType,
    });
    const expiresAt = new Date(Date.now() + UPLOAD_EXPIRY_SECONDS * 1000);
    const file = await this.prisma.storedFile.create({
      data: {
        id,
        uploadedById: actor.id,
        objectKey,
        purpose: dto.purpose,
        originalName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        expiresAt,
      },
    });
    const upload = await this.storage.createUpload({
      objectKey,
      mimeType: dto.mimeType,
    });
    return {
      file: this.toFileResponse(file),
      upload: { ...upload, expiresAt: expiresAt.toISOString() },
    };
  }

  async complete(fileId: string, activeUser: ActiveUserDto) {
    const actor = await this.requireManager(activeUser.sub);
    const file = await this.prisma.storedFile.findFirst({
      where: {
        id: fileId,
        uploadedById: actor.id,
        purpose: StoredFilePurpose.PRODUCT,
      },
    });
    if (!file) throw new NotFoundException('Uploaded file not found');
    if (file.status === StoredFileStatus.READY)
      return this.toFileResponse(file);
    if (
      file.status === StoredFileStatus.REJECTED ||
      file.expiresAt <= new Date()
    ) {
      throw new ConflictException('Upload has expired or was rejected');
    }
    try {
      await this.storage.verifyObject(file);
    } catch (error) {
      await this.prisma.storedFile.update({
        where: { id: file.id },
        data: { status: StoredFileStatus.REJECTED },
      });
      await this.storage.deleteObject(file.objectKey).catch(() => undefined);
      throw error;
    }
    const ready = await this.prisma.storedFile.update({
      where: { id: file.id },
      data: { status: StoredFileStatus.READY, readyAt: new Date() },
    });
    return this.toFileResponse(ready);
  }

  async attach(
    productId: number,
    dto: AttachProductImageDto,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireManager(activeUser.sub);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const file = await this.prisma.storedFile.findFirst({
      where: {
        id: dto.fileId,
        uploadedById: actor.id,
        purpose: StoredFilePurpose.PRODUCT,
        status: StoredFileStatus.READY,
        expiresAt: { gt: new Date() },
        productImage: null,
      },
    });
    if (!file) throw new BadRequestException('Product image is unavailable');

    const previous = await this.prisma.productImage.findUnique({
      where: { productId },
      include: { file: true },
    });
    const image = await this.prisma.$transaction(async (tx) => {
      if (previous) {
        await tx.productImage.delete({ where: { id: previous.id } });
      }
      return tx.productImage.create({
        data: { productId, fileId: file.id, attachedById: actor.id },
        include: { file: true },
      });
    });
    await this.storage.retainObject(file.objectKey);
    if (previous)
      await this.storage
        .deleteObject(previous.file.objectKey)
        .catch(() => undefined);
    return this.toImageResponse(image);
  }

  async remove(productId: number, activeUser: ActiveUserDto) {
    const actor = await this.requireManager(activeUser.sub);
    const image = await this.prisma.productImage.findUnique({
      where: { productId },
      include: { file: true },
    });
    if (!image) throw new NotFoundException('Product image not found');
    await this.prisma.productImage.delete({ where: { id: image.id } });
    await this.storage
      .deleteObject(image.file.objectKey)
      .catch(() => undefined);
    return { deleted: true, productId, removedById: actor.id };
  }

  async accessUrl(productId: number, activeUser: ActiveUserDto) {
    await this.requireReader(activeUser.sub);
    const image = await this.prisma.productImage.findFirst({
      where: { productId },
      include: { file: true },
    });
    if (!image) throw new NotFoundException('Product image not found');
    return this.storage.createAccessUrl(image.file);
  }

  private async requireManager(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isBranchManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage product images',
      );
    }
    return actor;
  }

  private async requireReader(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isUserManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to view product images',
      );
    }
    return actor;
  }

  private normalizeOriginalName(fileName: string) {
    const normalized = Array.from(fileName.split(/[\\/]/).pop() ?? 'image')
      .filter((character) => {
        const code = character.charCodeAt(0);
        return code >= 32 && code !== 127;
      })
      .join('')
      .slice(0, 255);
    return normalized || 'image';
  }

  private toFileResponse(file: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    status: StoredFileStatus;
    expiresAt: Date;
  }) {
    return {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      status: file.status,
      expiresAt: file.expiresAt,
    };
  }

  private toImageResponse(image: {
    id: number;
    productId: number;
    fileId: string;
    attachedById: number;
    createdAt: Date;
    file: {
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    };
  }) {
    return {
      id: image.id,
      productId: image.productId,
      fileId: image.fileId,
      attachedById: image.attachedById,
      createdAt: image.createdAt,
      originalName: image.file.originalName,
      mimeType: image.file.mimeType,
      sizeBytes: image.file.sizeBytes,
    };
  }
}
