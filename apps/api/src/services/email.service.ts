import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/** Email service — logs in dev when SMTP is not configured */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: false,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
    }
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      logger.info(`[Email Dev] To: ${to} | Subject: ${subject}`);
      return;
    }
    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const link = `${env.API_URL}/api/v1/auth/verify-email?token=${token}`;
    await this.send(
      email,
      'Verify your email',
      `<p>Click <a href="${link}">here</a> to verify your email.</p>`
    );
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const link = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
    await this.send(
      email,
      'Reset your password',
      `<p>Click <a href="${link}">here</a> to reset your password. Link expires in 1 hour.</p>`
    );
  }
}

export const emailService = new EmailService();
