import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../../storage/storage.service.js';
import {
  MAX_EXPENSE_ATTACHMENTS,
  UPLOAD_EXPIRY_SECONDS,
} from '../../storage/storage.constants.js';
import { PermissionProvider } from '../../user/providers/permission.provider.js';
import { UserService } from '../../user/providers/user.service.js';
import {
  ExpenseStatus,
  StoredFilePurpose,
  StoredFileStatus,
} from '../../generated/prisma/enums.js';
import type { User } from '../../generated/prisma/client.js';
import { ActiveUserDto } from '../../auth/dtos/active-user.dto.js';
import { PresignExpenseAttachmentDto } from '../dtos/presign-expense-attachment.dto.js';
import { AddExpenseAttachmentsDto } from '../dtos/add-expense-attachments.dto.js';

export const attachmentSelect = {
  id: true,
  fileId: true,
  createdAt: true,
  attachedBy: { select: { id: true, name: true } },
  file: {
    select: {
      originalName: true,
      mimeType: true,
      sizeBytes: true,
    },
  },
} as const;

export const toAttachmentResponse = (attachment: {
  id: number;
  fileId: string;
  createdAt: Date;
  attachedBy: { id: number; name: string };
  file: { originalName: string; mimeType: string; sizeBytes: number };
}) => ({
  id: attachment.id,
  fileId: attachment.fileId,
  originalName: attachment.file.originalName,
  mimeType: attachment.file.mimeType,
  sizeBytes: attachment.file.sizeBytes,
  createdAt: attachment.createdAt,
  attachedBy: attachment.attachedBy,
});

@Injectable()
export class ExpenseAttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly permission: PermissionProvider,
    private readonly users: UserService,
  ) {}

  async presign(dto: PresignExpenseAttachmentDto, activeUser: ActiveUserDto) {
    const actor = await this.requireManager(activeUser.sub);
    if (dto.purpose !== StoredFilePurpose.EXPENSE) {
      throw new BadRequestException('Purpose must be EXPENSE');
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
      file: this.toStoredFileResponse(file),
      upload: { ...upload, expiresAt: expiresAt.toISOString() },
    };
  }

  async complete(fileId: string, activeUser: ActiveUserDto) {
    const actor = await this.requireManager(activeUser.sub);
    const file = await this.prisma.storedFile.findFirst({
      where: {
        id: fileId,
        uploadedById: actor.id,
        purpose: StoredFilePurpose.EXPENSE,
      },
    });
    if (!file) throw new NotFoundException('Uploaded file not found');
    if (file.status === StoredFileStatus.READY) {
      return this.toStoredFileResponse(file);
    }
    if (file.status === StoredFileStatus.REJECTED || file.expiresAt <= new Date()) {
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
    return this.toStoredFileResponse(ready);
  }

  async attach(
    expenseId: number,
    dto: AddExpenseAttachmentsDto,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireManager(activeUser.sub);
    const expense = await this.requireScopedExpense(expenseId, actor);
    if (expense.status === ExpenseStatus.VOIDED) {
      throw new ConflictException('Voided expenses cannot receive attachments');
    }
    const files = await this.prepareFiles(
      dto.attachmentIds,
      actor.id,
      expense._count.attachments,
    );
    await Promise.all(files.map((file) => this.storage.retainObject(file.objectKey)));
    await this.prisma.expenseAttachment.createMany({
      data: files.map((file) => ({
        expenseId,
        fileId: file.id,
        attachedById: actor.id,
      })),
    });
    const attachments = await this.prisma.expenseAttachment.findMany({
      where: { expenseId },
      select: attachmentSelect,
      orderBy: { createdAt: 'asc' },
    });
    return attachments.map(toAttachmentResponse);
  }

  async accessUrl(
    expenseId: number,
    attachmentId: number,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireManager(activeUser.sub);
    const attachment = await this.prisma.expenseAttachment.findFirst({
      where: {
        id: attachmentId,
        expenseId,
        ...(!this.permission.isGlobalRole(actor.role) && {
          expense: { branchId: actor.branchId ?? -1 },
        }),
      },
      include: { file: true },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');
    return this.storage.createAccessUrl(attachment.file);
  }

  async prepareFiles(fileIds: string[], actorId: number, existingCount = 0) {
    if (existingCount + fileIds.length > MAX_EXPENSE_ATTACHMENTS) {
      throw new BadRequestException(
        `An expense can have at most ${MAX_EXPENSE_ATTACHMENTS} attachments`,
      );
    }
    const files = await this.prisma.storedFile.findMany({
      where: {
        id: { in: fileIds },
        uploadedById: actorId,
        purpose: StoredFilePurpose.EXPENSE,
        status: StoredFileStatus.READY,
        expiresAt: { gt: new Date() },
        expenseAttachment: null,
      },
    });
    if (files.length !== fileIds.length) {
      throw new BadRequestException('One or more attachments are unavailable');
    }
    return files;
  }

  async retainFiles(files: { objectKey: string }[]) {
    await Promise.all(files.map((file) => this.storage.retainObject(file.objectKey)));
  }

  private async requireManager(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isUserManager(actor.role)) {
      throw new ForbiddenException('You do not have permission to manage attachments');
    }
    return actor;
  }

  private async requireScopedExpense(id: number, actor: User) {
    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        ...(!this.permission.isGlobalRole(actor.role) && {
          branchId: actor.branchId ?? -1,
        }),
      },
      select: { status: true, _count: { select: { attachments: true } } },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  private normalizeOriginalName(fileName: string) {
    const normalized = Array.from(fileName.split(/[\\/]/).pop() ?? 'attachment')
      .filter((character) => {
        const code = character.charCodeAt(0);
        return code >= 32 && code !== 127;
      })
      .join('')
      .slice(0, 255);
    return normalized || 'attachment';
  }

  private toStoredFileResponse(file: {
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
