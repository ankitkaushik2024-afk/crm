import { reportRepository } from '../repositories/report.repository';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ForbiddenError, BadRequestError } from '../utils/errors';
import { ROLES } from '@crm/shared';

export class ReportService {
  /**
   * Generate attendance report with role-based access
   */
  async generateAttendanceReport(
    user: NonNullable<AuthenticatedRequest['user']>,
    input: {
      startDate: string;
      endDate: string;
      departmentId?: string;
    }
  ) {
    // Only HR, Manager, and Super Admin can generate reports
    const userRole = user.role as string;
    if (![ROLES.HR, ROLES.MANAGER, ROLES.SUPER_ADMIN].includes(userRole as any)) {
      throw new ForbiddenError('Insufficient permissions to generate reports');
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (startDate > endDate) {
      throw new BadRequestError('Start date must be before end date');
    }

    return reportRepository.getAttendanceReport(
      user.companyId,
      startDate,
      endDate,
      input.departmentId
    );
  }

  /**
   * Generate payroll report
   */
  async generatePayrollReport(
    user: NonNullable<AuthenticatedRequest['user']>,
    input: {
      month: number;
      year: number;
      departmentId?: string;
    }
  ) {
    // Only HR and Super Admin can generate payroll reports
    const userRole = user.role as string;
    if (![ROLES.HR, ROLES.SUPER_ADMIN].includes(userRole as any)) {
      throw new ForbiddenError('Insufficient permissions to generate payroll reports');
    }

    if (input.month < 1 || input.month > 12) {
      throw new BadRequestError('Month must be between 1 and 12');
    }

    return reportRepository.getPayrollReport(
      user.companyId,
      input.month,
      input.year,
      input.departmentId
    );
  }

  /**
   * Generate project progress report
   */
  async generateProjectProgressReport(
    user: NonNullable<AuthenticatedRequest['user']>
  ) {
    // All authenticated users can view project reports
    return reportRepository.getProjectProgressReport(user.companyId);
  }

  /**
   * Generate leave report
   */
  async generateLeaveReport(
    user: NonNullable<AuthenticatedRequest['user']>,
    input: {
      startDate: string;
      endDate: string;
    }
  ) {
    // Only HR and Super Admin can generate leave reports
    const userRole = user.role as string;
    if (![ROLES.HR, ROLES.SUPER_ADMIN].includes(userRole as any)) {
      throw new ForbiddenError('Insufficient permissions to generate leave reports');
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (startDate > endDate) {
      throw new BadRequestError('Start date must be before end date');
    }

    return reportRepository.getLeaveReport(user.companyId, startDate, endDate);
  }

  /**
   * Generate productivity report
   */
  async generateProductivityReport(
    user: NonNullable<AuthenticatedRequest['user']>,
    input?: {
      departmentId?: string;
    }
  ) {
    // Only Manager and Super Admin can generate productivity reports
    const userRole = user.role as string;
    if (![ROLES.MANAGER, ROLES.SUPER_ADMIN].includes(userRole as any)) {
      throw new ForbiddenError('Insufficient permissions to generate productivity reports');
    }

    return reportRepository.getProductivityReport(
      user.companyId,
      input?.departmentId
    );
  }

  /**
   * Export report to CSV format
   */
  exportToCSV(data: any[], filename: string): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            if (value === null || value === undefined) {
              return '';
            }
            const stringValue = String(value);
            return stringValue.includes(',')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          })
          .join(',')
      ),
    ].join('\n');

    return csv;
  }

  /**
   * Export report to JSON format
   */
  exportToJSON(data: any[], metadata?: any): string {
    return JSON.stringify(
      {
        metadata: {
          generatedAt: new Date().toISOString(),
          ...metadata,
        },
        data,
      },
      null,
      2
    );
  }
}

export const reportService = new ReportService();
