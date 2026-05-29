import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class SettingsRepository {
  async getByCompany(companyId: string) {
    return prisma.companySettings.findUnique({
      where: { companyId },
    });
  }

  async upsert(
    companyId: string,
    data: Prisma.CompanySettingsUncheckedUpdateInput
  ) {
    return prisma.companySettings.upsert({
      where: { companyId },
      update: data,
      create: {
        companyId,
        officeStartTime: typeof data.officeStartTime === 'string' ? data.officeStartTime : '09:00',
        officeEndTime: typeof data.officeEndTime === 'string' ? data.officeEndTime : '18:00',
        workDays: (data.workDays as Prisma.JsonArray | undefined) ?? [1, 2, 3, 4, 5],
        lateThresholdMin:
          typeof data.lateThresholdMin === 'number' ? data.lateThresholdMin : 15,
        emailNotifications:
          typeof data.emailNotifications === 'boolean' ? data.emailNotifications : true,
        theme: typeof data.theme === 'string' ? data.theme : 'system',
        payrollSettings: (data.payrollSettings as Prisma.JsonValue | undefined) ?? undefined,
      },
    });
  }
}

export const settingsRepository = new SettingsRepository();
