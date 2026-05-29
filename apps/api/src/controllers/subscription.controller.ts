import { Response } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { billingService } from '../services/billing.service';
import { stripeService } from '../services/stripe.service';
import { aiService } from '../services/ai.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response';

export class SubscriptionController {
  async getPlans(_req: AuthenticatedRequest, res: Response) {
    const plans = await subscriptionService.getPlans();
    return sendSuccess(res, plans);
  }

  async getCurrentSubscription(req: AuthenticatedRequest, res: Response) {
    const subscription = await subscriptionService.getCurrentSubscription(req.user!.companyId);
    return sendSuccess(res, subscription);
  }

  async createCheckoutSession(req: AuthenticatedRequest, res: Response) {
    const { planId } = req.body;
    const session = await stripeService.createCheckoutSession(req.user!.companyId, planId);
    return sendSuccess(res, session);
  }

  async handleStripeWebhook(req: AuthenticatedRequest, res: Response) {
    const result = await stripeService.handleWebhook(req.body);
    return sendSuccess(res, result);
  }

  async getInvoices(req: AuthenticatedRequest, res: Response) {
    const invoices = await billingService.getInvoices(req.user!.companyId);
    return sendSuccess(res, invoices);
  }

  async cancelSubscription(req: AuthenticatedRequest, res: Response) {
    const result = await subscriptionService.cancelSubscription(req.user!.companyId);
    return sendSuccess(res, result);
  }

  async getAILeavePredictions(req: AuthenticatedRequest, res: Response) {
    const predictions = await aiService.predictLeavePatterns(req.user!.companyId);
    return sendSuccess(res, predictions);
  }

  async getAITeamComposition(req: AuthenticatedRequest, res: Response) {
    const projectId = req.params.projectId as string;
    const suggestions = await aiService.suggestOptimalTeamComposition(projectId);
    return sendSuccess(res, suggestions);
  }
}

export const subscriptionController = new SubscriptionController();
