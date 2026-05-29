import { Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  async register(req: AuthenticatedRequest, res: Response) {
    const result = await authService.register(req.body);
    return sendCreated(res, result, 'Registration successful');
  }

  async login(req: AuthenticatedRequest, res: Response) {
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    const result = await authService.login(
      req.body.email,
      req.body.password,
      ip,
      userAgent
    );
    return sendSuccess(res, result, 'Login successful');
  }

  async refresh(req: AuthenticatedRequest, res: Response) {
    const result = await authService.refresh(req.body.refreshToken);
    return sendSuccess(res, result, 'Token refreshed');
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    await authService.logout(req.body.refreshToken, req.user?.id);
    return sendSuccess(res, null, 'Logged out');
  }

  async forgotPassword(req: AuthenticatedRequest, res: Response) {
    await authService.forgotPassword(req.body.email);
    return sendSuccess(res, null, 'If the email exists, a reset link was sent');
  }

  async resetPassword(req: AuthenticatedRequest, res: Response) {
    await authService.resetPassword(req.body.token, req.body.password);
    return sendSuccess(res, null, 'Password reset successful');
  }

  async verifyEmail(req: AuthenticatedRequest, res: Response) {
    await authService.verifyEmail(req.body.token);
    return sendSuccess(res, null, 'Email verified');
  }

  async me(req: AuthenticatedRequest, res: Response) {
    const user = await authService.getMe(req.user!.id);
    return sendSuccess(res, user);
  }
}

export const authController = new AuthController();
