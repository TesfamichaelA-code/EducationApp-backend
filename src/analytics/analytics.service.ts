import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PerformanceMetric } from './schemas/performance-metric.schema';
import { Report, ReportType } from './schemas/report.schema';
import { Certificate, CertificateType } from './schemas/certificate.schema';
import * as crypto from 'crypto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(PerformanceMetric.name)
    private performanceMetricModel: Model<PerformanceMetric>,
    @InjectModel(Report.name)
    private reportModel: Model<Report>,
    @InjectModel(Certificate.name)
    private certificateModel: Model<Certificate>,
  ) {}

  async generateDashboardData(userId: string) {
    const metrics = await this.performanceMetricModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(1)
      .exec();

    const certificates = await this.certificateModel
      .find({ user: userId })
      .sort({ issueDate: -1 })
      .exec();

    const reports = await this.reportModel
      .find({ users: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    return {
      metrics: metrics[0] || null,
      certificates,
      recentReports: reports,
    };
  }

  async generateReport(
    type: ReportType,
    data: any,
    periodStart: Date,
    periodEnd: Date,
    users: string[],
  ) {
    const report = new this.reportModel({
      title: `${type} Report - ${periodStart.toISOString().split('T')[0]}`,
      type,
      data,
      periodStart,
      periodEnd,
      users,
      metrics: ['completionRate', 'averageScore', 'learningSpeed'],
      kpis: new Map([
        ['overallProgress', data.overallProgress],
        ['skillGrowth', data.skillGrowth],
      ]),
    });

    return report.save();
  }

  async generateCertificate(
    userId: string,
    type: CertificateType,
    title: string,
    metadata: any,
  ) {
    const certificateNumber = crypto
      .createHash('sha256')
      .update(`${userId}-${type}-${Date.now()}`)
      .digest('hex')
      .substring(0, 12)
      .toUpperCase();

    const certificate = new this.certificateModel({
      user: userId,
      type,
      title,
      certificateNumber,
      issueDate: new Date(),
      metadata,
    });

    return certificate.save();
  }

  async updatePerformanceMetrics(userId: string, metrics: any) {
    const performanceMetric = new this.performanceMetricModel({
      user: userId,
      ...metrics,
      periodStart: new Date(),
      periodEnd: new Date(),
    });

    return performanceMetric.save();
  }

  async getComplianceStatus(userId: string) {
    const certificates = await this.certificateModel
      .find({
        user: userId,
        type: CertificateType.COMPLIANCE,
        isValid: true,
        expiryDate: { $gt: new Date() },
      })
      .exec();

    return {
      compliant: certificates.length > 0,
      certificates,
    };
  }
}