import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { ReportType } from './schemas/report.schema';
import { CertificateType } from './schemas/certificate.schema';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/:userId')
  async getDashboard(@Param('userId') userId: string) {
    return this.analyticsService.generateDashboardData(userId);
  }

  @Post('reports')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async generateReport(
    @Body()
    body: {
      type: ReportType;
      data: any;
      periodStart: Date;
      periodEnd: Date;
      users: string[];
    },
  ) {
    return this.analyticsService.generateReport(
      body.type,
      body.data,
      body.periodStart,
      body.periodEnd,
      body.users,
    );
  }

  @Post('certificates')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async generateCertificate(
    @Body()
    body: {
      userId: string;
      type: CertificateType;
      title: string;
      metadata: any;
    },
  ) {
    return this.analyticsService.generateCertificate(
      body.userId,
      body.type,
      body.title,
      body.metadata,
    );
  }

  @Get('compliance/:userId')
  async getComplianceStatus(@Param('userId') userId: string) {
    return this.analyticsService.getComplianceStatus(userId);
  }

  @Post('metrics/:userId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async updateMetrics(
    @Param('userId') userId: string,
    @Body() metrics: any,
  ) {
    return this.analyticsService.updatePerformanceMetrics(userId, metrics);
  }
}