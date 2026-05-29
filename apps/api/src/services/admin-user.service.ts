import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class AdminUserService {
  async list(companyId: string, query: { page: number; limit: number; search?: string }) {
    const where = {
      companyId,
      deletedAt: null,
      ...(query.search && {
        OR: [
          { email: { contains: query.search } },
          { firstName: { contains: query.search } },
          { lastName: { contains: query.search } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
          employee: { select: { id: true, employeeCode: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async update(
    companyId: string,
    userId: string,
    input: { roleId?: string; status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' }
  ) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId, deletedAt: null } });
    if (!user) throw new NotFoundError('User not found');

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.roleId !== undefined && { roleId: input.roleId }),
        ...(input.status !== undefined && { status: input.status }),
      },
      include: {
        role: true,
        employee: { select: { id: true, employeeCode: true } },
      },
    });
  }
}

export const adminUserService = new AdminUserService();
