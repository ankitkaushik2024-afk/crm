import { NotFoundError } from '../utils/errors';
import { projectRepository } from '../repositories/project.repository';
import { auditService } from './audit.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ProjectService {
  async list(
    user: NonNullable<AuthenticatedRequest['user']>,
    query: { page: number; limit: number; search?: string; status?: string }
  ) {
    const { items, total } = await projectRepository.list(user.companyId, query);
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

  async getById(user: NonNullable<AuthenticatedRequest['user']>, id: string) {
    const project = await projectRepository.findById(user.companyId, id);
    if (!project) throw new NotFoundError('Project not found');
    return project;
  }

  async create(
    user: NonNullable<AuthenticatedRequest['user']>,
    input: {
      name: string;
      code?: string;
      description?: string;
      status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
      startDate?: string;
      endDate?: string;
      managerId?: string;
    }
  ) {
    const project = await projectRepository.create({
      companyId: user.companyId,
      name: input.name,
      code: input.code,
      description: input.description,
      status: input.status ?? 'PLANNING',
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      managerId: input.managerId ?? null,
    });

    await auditService.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CREATE',
      entityType: 'Project',
      entityId: project.id,
    });

    return project;
  }

  async update(
    user: NonNullable<AuthenticatedRequest['user']>,
    id: string,
    input: {
      name?: string;
      code?: string | null;
      description?: string | null;
      status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
      startDate?: string | null;
      endDate?: string | null;
      managerId?: string | null;
      progress?: number;
    }
  ) {
    const existing = await projectRepository.findById(user.companyId, id);
    if (!existing) throw new NotFoundError('Project not found');

    return projectRepository.update(id, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.code !== undefined && { code: input.code }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.startDate !== undefined && {
        startDate: input.startDate ? new Date(input.startDate) : null,
      }),
      ...(input.endDate !== undefined && {
        endDate: input.endDate ? new Date(input.endDate) : null,
      }),
      ...(input.managerId !== undefined && { managerId: input.managerId }),
      ...(input.progress !== undefined && { progress: input.progress }),
    });
  }

  async remove(user: NonNullable<AuthenticatedRequest['user']>, id: string) {
    const existing = await projectRepository.findById(user.companyId, id);
    if (!existing) throw new NotFoundError('Project not found');
    await projectRepository.softDelete(id);
  }
}

export const projectService = new ProjectService();
