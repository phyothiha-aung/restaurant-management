import { Controller, Get, Query } from '@nestjs/common';
import { ActiveUser } from '../auth/decorators/active-user.decorator.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { ActiveUserDto } from '../auth/dtos/active-user.dto.js';
import { UserRole } from '../generated/prisma/enums.js';
import { FinancialReportQueryDto } from './dtos/financial-report-query.dto.js';
import { FinancialReportService } from './providers/financial-report.service.js';

@Controller('reports')
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
export class ReportController {
  constructor(private readonly reports: FinancialReportService) {}

  @Get('financial')
  financial(
    @Query() query: FinancialReportQueryDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.reports.getFinancialReport(query, user);
  }
}
