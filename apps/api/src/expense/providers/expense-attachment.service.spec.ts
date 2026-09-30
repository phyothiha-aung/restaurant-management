import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  ExpenseStatus,
  StoredFilePurpose,
  StoredFileStatus,
  UserRole,
} from '../../generated/prisma/enums.js';
import { ExpenseAttachmentService } from './expense-attachment.service.js';

const actor = { id: 7, branchId: 2, role: UserRole.BRANCH_MANAGER };

const createService = () => {
  const prisma: any = {
    storedFile: { findMany: vi.fn(), findFirst: vi.fn() },
    expense: { findFirst: vi.fn() },
    expenseAttachment: { findFirst: vi.fn(), findMany: vi.fn(), createMany: vi.fn() },
  };
  const storage: any = {
    retainObject: vi.fn(),
    createAccessUrl: vi.fn().mockResolvedValue({ url: 'signed', expiresAt: 'soon' }),
  };
  const permission: any = {
    isUserManager: vi.fn().mockReturnValue(true),
    isGlobalRole: vi.fn().mockReturnValue(false),
  };
  const users: any = { requireUser: vi.fn().mockResolvedValue(actor) };
  return {
    service: new ExpenseAttachmentService(prisma, storage, permission, users),
    prisma,
    storage,
  };
};

describe('ExpenseAttachmentService', () => {
  it('rejects attachment counts above the expense limit', async () => {
    const { service } = createService();
    await expect(
      service.prepareFiles(['one'], actor.id, 5),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects files that are not ready, owned, unexpired, and unattached', async () => {
    const { service, prisma } = createService();
    prisma.storedFile.findMany.mockResolvedValue([]);
    await expect(
      service.prepareFiles(['4f4a2458-53c8-4e36-a49d-a1f591da0980'], actor.id),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.storedFile.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        uploadedById: actor.id,
        purpose: StoredFilePurpose.EXPENSE,
        status: StoredFileStatus.READY,
        expenseAttachment: null,
      }),
    });
  });

  it('returns not found instead of exposing a cross-branch attachment', async () => {
    const { service, prisma, storage } = createService();
    prisma.expenseAttachment.findFirst.mockResolvedValue(null);
    await expect(
      service.accessUrl(10, 20, { sub: actor.id } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.expenseAttachment.findFirst).toHaveBeenCalledWith({
      where: {
        id: 20,
        expenseId: 10,
        expense: { branchId: actor.branchId },
      },
      include: { file: true },
    });
    expect(storage.createAccessUrl).not.toHaveBeenCalled();
  });

  it('rejects attaching files to a voided expense', async () => {
    const { service, prisma } = createService();
    prisma.expense.findFirst.mockResolvedValue({
      status: ExpenseStatus.VOIDED,
      _count: { attachments: 0 },
    });
    await expect(
      service.attach(
        10,
        { attachmentIds: ['4f4a2458-53c8-4e36-a49d-a1f591da0980'] },
        { sub: actor.id } as any,
      ),
    ).rejects.toThrow('Voided expenses cannot receive attachments');
  });
});
