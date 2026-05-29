import type { AuditAction } from '@prisma/client';
import { auditRepository } from '../repositories/audit.repository';

export class AuditService {
  async log(params: {
    companyId: string;
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    oldValues?: unknown;
    newValues?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return auditRepository.create({
      ...params,
      oldValues: params.oldValues as never,
      newValues: params.newValues as never,
    });
  }
}

export const auditService = new AuditService();
