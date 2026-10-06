import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module.js';
import { ReportController } from './report.controller.js';
import { FinancialReportService } from './providers/financial-report.service.js';

@Module({
  imports: [UserModule],
  controllers: [ReportController],
  providers: [FinancialReportService],
})
export class ReportModule {}
