import type { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';

export class ReportRepository {
  /**
   * Generate attendance report for a date range
   */
  async getAttendanceReport(
    companyId: string,
    startDate: Date,
    endDate: Date,
    departmentId?: string
  ) {
    const where: Prisma.AttendanceWhereInput = {
      date: { gte: startDate, lte: endDate },
      employee: {
        companyId,
        deletedAt: null,
        ...(departmentId && { departmentId }),
      },
    };

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            department: { select: { id: true, name: true } },
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ employee: { user: { firstName: 'asc' } } }, { date: 'desc' }],
    });

    // Aggregate statistics
    const stats = {
      totalDays: this.getDaysInRange(startDate, endDate),
      totalRecords: attendances.length,
      presentCount: attendances.filter((a) => a.status === 'PRESENT').length,
      absentCount: attendances.filter((a) => a.status === 'ABSENT').length,
      lateCount: attendances.filter((a) => a.status === 'LATE').length,
      halfDayCount: attendances.filter((a) => a.status === 'HALF_DAY').length,
      remoteCount: attendances.filter((a) => a.status === 'REMOTE').length,
      leaveCount: attendances.filter((a) => a.status === 'ON_LEAVE').length,
    };

    return {
      data: attendances,
      stats,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate payroll report for a month
   */
  async getPayrollReport(companyId: string, monthNumber: number, yearNumber: number, departmentId?: string) {
    const payrolls = await prisma.payroll.findMany({
      where: {
        employee: {
          companyId,
          deletedAt: null,
          ...(departmentId && { departmentId }),
        },
        month: monthNumber,
        year: yearNumber,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            department: { select: { name: true } },
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals - convert Decimal to number
    const totals = {
      baseSalaryTotal: 0,
      allowancesTotal: 0,
      deductionsTotal: 0,
      bonusTotal: 0,
      taxTotal: 0,
      netSalaryTotal: 0,
      count: payrolls.length,
    };

    payrolls.forEach((p) => {
      totals.baseSalaryTotal += Number(p.baseSalary);
      totals.allowancesTotal += Number(p.allowances);
      totals.deductionsTotal += Number(p.deductions);
      totals.bonusTotal += Number(p.bonus);
      totals.taxTotal += Number(p.tax);
      totals.netSalaryTotal += Number(p.netSalary);
    });

    return {
      data: payrolls,
      totals,
      month: monthNumber,
      year: yearNumber,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate project progress report
   */
  async getProjectProgressReport(companyId: string) {
    const projects = await prisma.project.findMany({
      where: { companyId, deletedAt: null },
      include: {
        members: {
          include: {
            employee: {
              select: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        tasks: {
          where: { deletedAt: null },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedProjects = projects.map((p) => {
      const tasks = p.tasks;
      const taskStats = {
        total: tasks.length,
        pending: tasks.filter((t: any) => t.status === 'PENDING').length,
        inProgress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        review: tasks.filter((t: any) => t.status === 'REVIEW').length,
        completed: tasks.filter((t: any) => t.status === 'COMPLETED').length,
      };

      return {
        ...p,
        taskStats,
        completionPercentage: p.progress || 0,
      };
    });

    return {
      data: enrichedProjects,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate leave report
   */
  async getLeaveReport(companyId: string, startDate: Date, endDate: Date) {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        startDate: { gte: startDate },
        endDate: { lte: endDate },
        employee: { companyId, deletedAt: null },
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { firstName: true, lastName: true } },
            department: { select: { name: true } },
          },
        },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: leaves.length,
      pending: leaves.filter((l: any) => l.status === 'PENDING').length,
      approved: leaves.filter((l: any) => l.status === 'APPROVED').length,
      rejected: leaves.filter((l: any) => l.status === 'REJECTED').length,
    };

    return {
      data: leaves,
      stats,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate employee productivity report
   */
  async getProductivityReport(companyId: string, departmentId?: string) {
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(departmentId && { departmentId }),
      },
      include: {
        user: true,
        assignedTasks: {
          where: { deletedAt: null },
          include: {
            project: { select: { name: true } },
          },
        },
        attendances: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        },
      },
      orderBy: { user: { firstName: 'asc' } },
    });

    const enrichedEmployees = employees.map((e: any) => {
      const tasks = e.assignedTasks;
      const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;
      const presentDays = e.attendances.filter(
        (a: any) => a.status === 'PRESENT' || a.status === 'REMOTE'
      ).length;

      return {
        id: e.id,
        name: `${e.user.firstName} ${e.user.lastName}`,
        employeeCode: e.employeeCode,
        totalTasks: tasks.length,
        completedTasks,
        completionRate: tasks.length ? (completedTasks / tasks.length) * 100 : 0,
        presentDays,
        tasksByPriority: {
          high: tasks.filter((t: any) => t.priority === 'HIGH').length,
          medium: tasks.filter((t: any) => t.priority === 'MEDIUM').length,
          low: tasks.filter((t: any) => t.priority === 'LOW').length,
        },
      };
    });

    return {
      data: enrichedEmployees,
      generatedAt: new Date(),
    };
  }

  private getDaysInRange(startDate: Date, endDate: Date): number {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil(
      (endDate.getTime() - startDate.getTime()) / millisecondsPerDay
    );
  }
}

export const reportRepository = new ReportRepository();
