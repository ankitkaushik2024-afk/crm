import { prisma } from '../config/database';

export class AuthRepository {
  async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { role: true } } },
    });
  }

  async revokeRefreshToken(token: string) {
    return prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async createSession(userId: string, expiresAt: Date, ip?: string, userAgent?: string) {
    return prisma.session.create({
      data: { userId, expiresAt, ipAddress: ip, userAgent },
    });
  }

  async createPasswordReset(userId: string, token: string, expiresAt: Date) {
    return prisma.passwordReset.create({
      data: { userId, token, expiresAt },
    });
  }

  async findPasswordReset(token: string) {
    return prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async markPasswordResetUsed(id: string) {
    return prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async createEmailVerification(userId: string, token: string, expiresAt: Date) {
    return prisma.emailVerification.create({
      data: { userId, token, expiresAt },
    });
  }

  async findEmailVerification(token: string) {
    return prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async markEmailVerificationUsed(id: string) {
    return prisma.emailVerification.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}

export const authRepository = new AuthRepository();
