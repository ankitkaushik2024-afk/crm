import { prisma } from '../config/database';
import { subscriptionService } from './subscription.service';
import { billingService } from './billing.service';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class StripeService {
  /**
   * Mock creation of checkout session
   */
  async createCheckoutSession(companyId: string, planId: string) {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    const sessionId = `mock_session_${Math.random().toString(36).substring(2, 15)}`;
    
    // In production, you would make a call to stripe:
    // const session = await stripe.checkout.sessions.create({...})
    
    const mockUrl = `/billing/success?session_id=${sessionId}&company_id=${companyId}&plan_id=${planId}`;

    logger.info(`Mock Stripe checkout session created for company ${companyId} under plan ${plan.name}`);

    return {
      sessionId,
      url: mockUrl,
    };
  }

  /**
   * Handle mock Stripe webhook payloads (for local development testing)
   */
  async handleWebhook(event: { type: string; data: any }) {
    logger.info(`Processing mock Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const { companyId, planId, subscriptionId } = event.data;
        
        // Upgrade plan
        await subscriptionService.upgradeSubscription(companyId, planId, subscriptionId);

        // Generate paid invoice
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (plan) {
          await billingService.generateInvoice(
            companyId,
            Number(plan.monthlyPrice),
            'PAID'
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const { companyId, amount } = event.data;
        
        // Create paid invoice
        await billingService.generateInvoice(companyId, amount, 'PAID');
        break;
      }

      case 'customer.subscription.deleted': {
        const { companyId } = event.data;
        
        // Cancel subscription
        await subscriptionService.cancelSubscription(companyId);
        break;
      }

      default:
        logger.warn(`Unhandled mock Stripe webhook event type: ${event.type}`);
    }

    return { received: true };
  }
}

export const stripeService = new StripeService();
