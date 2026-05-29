import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

const taskInclude = {
  project: { select: { id: true, name: true, code: true } },
  assignee: {
    select: {
      id: true,
      employeeCode: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.TaskInclude;

export class TaskRepository {
  async list(
    companyId: string,
    query: {
      page: number;
      limit: number;
      projectId?: string;
      status?: string;
      assigneeId?: string;
      search?: string;
    }
  ) {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      ...(query.projectId && { projectId: query.projectId }),
      ...(query.status && { status: query.status as Prisma.TaskWhereInput['status'] }),
      ...(query.assigneeId && { assigneeId: query.assigneeId }),
      ...(query.search && { title: { contains: query.search } }),
      OR: [{ project: { companyId, deletedAt: null } }, { assignee: { companyId, deletedAt: null } }],
    };

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.task.count({ where }),
    ]);

    return { items, total };
  }

  async findById(companyId: string, id: string) {
    return prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [{ project: { companyId, deletedAt: null } }, { assignee: { companyId, deletedAt: null } }],
      },
      include: taskInclude,
    });
  }

  async create(data: Prisma.TaskUncheckedCreateInput) {
    return prisma.task.create({ data, include: taskInclude });
  }

  async update(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({ where: { id }, data, include: taskInclude });
  }
}

export const taskRepository = new TaskRepository();
