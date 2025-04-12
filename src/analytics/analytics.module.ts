import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PerformanceMetric, PerformanceMetricSchema } from './schemas/performance-metric.schema';
import { Report, ReportSchema } from './schemas/report.schema';
import { Certificate, CertificateSchema } from './schemas/certificate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PerformanceMetric.name, schema: PerformanceMetricSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Certificate.name, schema: CertificateSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}