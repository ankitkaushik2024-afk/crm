import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

const projectInclude = {
  members: {
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} satisfies Prisma.ProjectInclude;

export class ProjectRepository {
  async list(
    companyId: string,
    query: { page: number; limit: number; search?: string; status?: string }
  ) {
    const where: Prisma.ProjectWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status && { status: query.status as Prisma.ProjectWhereInput['status'] }),
      ...(query.search && {
        OR: [{ name: { contains: query.search } }, { code: { contains: query.search } }],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: projectInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.project.count({ where }),
    ]);

    return { items, total };
  }

  async findById(companyId: string, id: string) {
    return prisma.project.findFirst({
      where: { id, companyId, deletedAt: null },
      include: projectInclude,
    });
  }

  async create(data: Prisma.ProjectUncheckedCreateInput) {
    return prisma.project.create({ data, include: projectInclude });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({ where: { id }, data, include: projectInclude });
  }

  async softDelete(id: string) {
    return prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const projectRepository = new ProjectRepository();
