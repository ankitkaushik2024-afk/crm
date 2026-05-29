import { z } from 'zod';

export const attendanceReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  departmentId: z.string().optional(),
});

export const payrollReportSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  departmentId: z.string().optional(),
});

export const leaveReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export const productivityReportSchema = z.object({
  departmentId: z.string().optional(),
});

export const exportAttendanceReportSchema = attendanceReportSchema.extend({
  format: z.enum(['csv', 'json']).optional().default('csv' as any),
});
