import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '../generated/prisma/enums.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { ActiveUser } from '../auth/decorators/active-user.decorator.js';
import { ActiveUserDto } from '../auth/dtos/active-user.dto.js';
import { ExpenseService } from './providers/expense.service.js';
import { CreateExpenseDto } from './dtos/create-expense.dto.js';
import { UpdateExpenseDto } from './dtos/update-expense.dto.js';
import { VoidExpenseDto } from './dtos/void-expense.dto.js';
import { ExpenseQueryDto } from './dtos/expense-query.dto.js';
import { ExpenseAttachmentService } from './providers/expense-attachment.service.js';
import { PresignExpenseAttachmentDto } from './dtos/presign-expense-attachment.dto.js';
import { AddExpenseAttachmentsDto } from './dtos/add-expense-attachments.dto.js';

const expenseManagerRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.BRANCH_MANAGER,
];

@Controller('expenses')
@Roles(...expenseManagerRoles)
export class ExpenseController {
  constructor(
    private readonly expenses: ExpenseService,
    private readonly attachments: ExpenseAttachmentService,
  ) {}

  @Post('attachments/presign')
  presignAttachment(
    @Body() dto: PresignExpenseAttachmentDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.attachments.presign(dto, user);
  }

  @Post('attachments/:fileId/complete')
  completeAttachment(
    @Param('fileId') fileId: string,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.attachments.complete(fileId, user);
  }

  @Post(':id/attachments')
  attachFiles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddExpenseAttachmentsDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.attachments.attach(id, dto, user);
  }

  @Get(':id/attachments/:attachmentId/access-url')
  attachmentAccessUrl(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.attachments.accessUrl(id, attachmentId, user);
  }

  @Get()
  findAll(
    @Query() query: ExpenseQueryDto,
    @ActiveUser() user: ActiveUserDto,
    @Req() request: Request,
  ) {
    return this.expenses.findAll(query, user, request);
  }

  @Post()
  create(
    @Body() dto: CreateExpenseDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.expenses.create(dto, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.expenses.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.expenses.update(id, dto, user);
  }

  @Delete(':id')
  void(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VoidExpenseDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.expenses.void(id, dto, user);
  }
}
