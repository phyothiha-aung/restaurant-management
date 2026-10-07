import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ActiveUserDto } from '../auth/dtos/active-user.dto.js';
import {
  StoredFilePurpose,
  StoredFileStatus,
  UserRole,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { UPLOAD_EXPIRY_SECONDS } from '../storage/storage.constants.js';
import { UserService } from '../user/providers/user.service.js';
import type { AttachRestaurantLogoDto } from './dtos/attach-restaurant-logo.dto.js';
import type { PresignRestaurantLogoDto } from './dtos/presign-restaurant-logo.dto.js';
import { RestaurantSettingsService } from './restaurant-settings.service.js';

const editors = new Set<UserRole>([
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
]);

@Injectable()
export class RestaurantLogoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly users: UserService,
    private readonly settings: RestaurantSettingsService,
  ) {}

  async presign(dto: PresignRestaurantLogoDto, activeUser: ActiveUserDto) {
    const actor = await this.requireEditor(activeUser.sub);
    const id = randomUUID();
    const originalName = this.normalizeOriginalName(dto.fileName);
    const objectKey = this.storage.buildKey({
      purpose: StoredFilePurpose.RESTAURANT_LOGO,
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
        purpose: StoredFilePurpose.RESTAURANT_LOGO,
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
    const actor = await this.requireEditor(activeUser.sub);
    const file = await this.prisma.storedFile.findFirst({
      where: {
        id: fileId,
        uploadedById: actor.id,
        purpose: StoredFilePurpose.RESTAURANT_LOGO,
      },
    });
    if (!file) throw new NotFoundException('Uploaded logo not found');
    if (file.status === StoredFileStatus.READY) return this.toFileResponse(file);
    if (file.status === StoredFileStatus.REJECTED || file.expiresAt <= new Date()) {
      throw new ConflictException('Logo upload has expired or was rejected');
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
    dto: AttachRestaurantLogoDto,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireEditor(activeUser.sub);
    const file = await this.prisma.storedFile.findFirst({
      where: {
        id: dto.fileId,
        uploadedById: actor.id,
        purpose: StoredFilePurpose.RESTAURANT_LOGO,
        status: StoredFileStatus.READY,
        expiresAt: { gt: new Date() },
        restaurantSettingsLogo: null,
      },
    });
    if (!file) throw new BadRequestException('Restaurant logo is unavailable');
    const previous = await this.prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      include: { logo: true },
    });
    if (!previous) throw new NotFoundException('Restaurant settings not found');

    await this.storage.retainObject(file.objectKey);
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.restaurantSettings.update({
          where: { id: 1 },
          data: { logoFileId: file.id, updatedById: actor.id },
        });
        if (previous.logo) {
          await tx.storedFile.update({
            where: { id: previous.logo.id },
            data: { status: StoredFileStatus.REJECTED },
          });
        }
      });
    } catch (error) {
      await this.storage.markPendingObject(file.objectKey).catch(() => undefined);
      throw error;
    }
    if (previous.logo) {
      await this.storage.deleteObject(previous.logo.objectKey).catch(() => undefined);
    }
    return this.settings.getSettings();
  }

  async remove(activeUser: ActiveUserDto) {
    const actor = await this.requireEditor(activeUser.sub);
    const settings = await this.prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      include: { logo: true },
    });
    if (!settings) throw new NotFoundException('Restaurant settings not found');
    if (!settings.logo) return this.settings.getSettings();
    await this.prisma.$transaction(async (tx) => {
      await tx.restaurantSettings.update({
        where: { id: 1 },
        data: { logoFileId: null, updatedById: actor.id },
      });
      await tx.storedFile.update({
        where: { id: settings.logo!.id },
        data: { status: StoredFileStatus.REJECTED },
      });
    });
    await this.storage.deleteObject(settings.logo.objectKey).catch(() => undefined);
    return this.settings.getSettings();
  }

  private async requireEditor(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!editors.has(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage restaurant branding',
      );
    }
    return actor;
  }

  private normalizeOriginalName(fileName: string) {
    const normalized = Array.from(fileName.split(/[\\/]/).pop() ?? 'logo')
      .filter((character) => {
        const code = character.charCodeAt(0);
        return code >= 32 && code !== 127;
      })
      .join('')
      .slice(0, 255);
    return normalized || 'logo';
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
}
