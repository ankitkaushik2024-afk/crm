import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class RoleService {
  async listRoles() {
    return prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRole(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundError('Role not found');
    return role;
  }

  async listPermissions() {
    return prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { key: 'asc' }] });
  }
}

export const roleService = new RoleService();
