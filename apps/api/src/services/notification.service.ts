import { prisma } from '../config/database';
import { env } from '../config/env';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import type { NotificationType } from '@prisma/client';
import { getIO } from '../websocket/socket.handler';

/**
 * Notification Service - handles creating, sending, and managing notifications
 * Supports both in-app and email notifications
 */
export class NotificationService {
  private emailTransporter = this.initializeEmailTransporter();

  private initializeEmailTransporter() {
    if (!env.SMTP_HOST) {
      logger.warn('SMTP not configured - email notifications disabled');
      return null;
    }

    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: (env.SMTP_PORT || 587) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  /**
   * Create and send an in-app notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: data || {},
        },
      });

      // Emit socket event for real-time notification
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('notification:new', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
        });
      }

      logger.debug(`Notification created for user ${userId}: ${title}`);

      return notification;
    } catch (error) {
      logger.error('Failed to create notification', { userId, type, error });
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(
    email: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ) {
    if (!this.emailTransporter) {
      logger.warn(`Email notification requested but SMTP not configured for ${email}`);
      return null;
    }

    try {
      const info = await this.emailTransporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject,
        text: textContent || subject,
        html: htmlContent,
      });

      logger.info(`Email sent successfully to ${email}: ${subject}`);
      return info;
    } catch (error) {
      logger.error('Failed to send email', { email, subject, error });
      throw error;
    }
  }

  /**
   * Notify leave request approval
   */
  async notifyLeaveApproval(
    employeeId: string,
    leaveRequestId: string,
    approved: boolean
  ) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) return;

    const status = approved ? 'APPROVED' : 'REJECTED';
    const title = `Leave Request ${status}`;
    const message = approved
      ? 'Your leave request has been approved.'
      : 'Your leave request has been rejected.';

    // Create in-app notification
    await this.createNotification(employee.userId, 'LEAVE', title, message, {
      leaveRequestId,
      approved,
    });

    // Send email
    if (employee.user.email) {
      const htmlContent = this.generateLeaveApprovalEmail(
        employee.user.firstName,
        approved
      );
      await this.sendEmailNotification(
        employee.user.email,
        title,
        htmlContent
      );
    }
  }

  /**
   * Notify payroll processing
   */
  async notifyPayrollProcessed(
    employeeId: string,
    month: number,
    year: number,
    netSalary: number
  ) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) return;

    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const title = `Payroll Processed - ${monthName}`;
    const message = `Your salary for ${monthName} has been processed.`;

    // Create in-app notification
    await this.createNotification(employee.userId, 'PAYROLL', title, message, {
      month,
      year,
      netSalary,
    });

    // Send email
    if (employee.user.email) {
      const htmlContent = this.generatePayrollEmail(
        employee.user.firstName,
        monthName,
        netSalary
      );
      await this.sendEmailNotification(
        employee.user.email,
        title,
        htmlContent
      );
    }
  }

  /**
   * Notify task assignment
   */
  async notifyTaskAssignment(
    assigneeId: string,
    taskId: string,
    taskTitle: string,
    assignedBy?: string
  ) {
    const employee = await prisma.employee.findUnique({
      where: { id: assigneeId },
      include: { user: true },
    });

    if (!employee) return;

    const title = `Task Assigned: ${taskTitle}`;
    const message = `A new task has been assigned to you.`;

    // Create in-app notification
    await this.createNotification(employee.userId, 'TASK', title, message, {
      taskId,
      assignedBy,
    });

    // Send email
    if (employee.user.email) {
      const htmlContent = this.generateTaskAssignmentEmail(
        employee.user.firstName,
        taskTitle
      );
      await this.sendEmailNotification(
        employee.user.email,
        title,
        htmlContent
      );
    }
  }

  /**
   * Notify announcement
   */
  async notifyAnnouncement(companyId: string, announcementId: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) return;

    // Get all users in company
    const users = await prisma.user.findMany({
      where: {
        employee: { companyId, deletedAt: null },
      },
      select: { id: true, email: true, firstName: true },
    });

    // Create notifications for all users
    await Promise.all(
      users.map((user) =>
        this.createNotification(
          user.id,
          'ANNOUNCEMENT',
          announcement.title,
          announcement.content,
          { announcementId }
        )
      )
    );

    logger.info(`Announcement notified to ${users.length} users in company ${companyId}`);
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string, limit: number = 10) {
    return prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get all notifications for a user (paginated)
   */
  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // Email template generators
  private generateLeaveApprovalEmail(
    firstName: string,
    approved: boolean
  ): string {
    const status = approved ? 'Approved' : 'Rejected';
    const bgColor = approved ? '#10b981' : '#ef4444';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${bgColor}; color: white; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0;">Leave Request ${status}</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 4px 4px;">
          <p>Hi ${firstName},</p>
          <p>Your leave request has been <strong>${status.toLowerCase()}</strong>.</p>
          <p>Please log in to your account for more details.</p>
          <br/>
          <p>Best regards,<br/>Nexus CRM Team</p>
        </div>
      </div>
    `;
  }

  private generatePayrollEmail(
    firstName: string,
    monthName: string,
    netSalary: number
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0;">Payroll Processed</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 4px 4px;">
          <p>Hi ${firstName},</p>
          <p>Your salary for <strong>${monthName}</strong> has been processed.</p>
          <p style="font-size: 18px; font-weight: bold; color: #10b981;">Net Salary: $${netSalary.toLocaleString()}</p>
          <p>You can view your payslip in your account.</p>
          <br/>
          <p>Best regards,<br/>Nexus CRM Team</p>
        </div>
      </div>
    `;
  }

  private generateTaskAssignmentEmail(
    firstName: string,
    taskTitle: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0;">New Task Assigned</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 4px 4px;">
          <p>Hi ${firstName},</p>
          <p>A new task has been assigned to you:</p>
          <p style="font-size: 16px; font-weight: bold; color: #1f2937; background-color: white; padding: 12px; border-left: 4px solid #8b5cf6;">${taskTitle}</p>
          <p>Log in to your account to view details and start working on it.</p>
          <br/>
          <p>Best regards,<br/>Nexus CRM Team</p>
        </div>
      </div>
    `;
  }
}

export const notificationService = new NotificationService();
