import { dashboardRepository } from '../repositories/dashboard.repository';

export class DashboardService {
  async getDashboard(companyId: string, role: string) {
    if (role === 'SUPER_ADMIN') {
      return dashboardRepository.getSuperAdminStats(companyId);
    }
    return dashboardRepository.getRoleStats(companyId, role);
  }
}

export const dashboardService = new DashboardService();
