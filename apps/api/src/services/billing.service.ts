import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class BillingService {
  /**
   * Get all invoices for a company
   */
  async getInvoices(companyId: string) {
    return prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generate a manual invoice
   */
  async generateInvoice(
    companyId: string,
    amount: number,
    status: string = 'DRAFT'
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found for company');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // Net 15 terms

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        subscriptionId: subscription.id,
        amount,
        status,
        dueDate,
      },
    });

    logger.info(`Invoice generated for company ${companyId}: $${amount}`);
    return invoice;
  }

  /**
   * Track usage record (e.g. api_calls, storage_gb) for subscription billing
   */
  async trackUsage(companyId: string, metric: string, value: number) {
    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
    });

    if (!subscription) {
      logger.warn(`Attempted to track usage for company ${companyId} but no subscription was found`);
      return null;
    }

    const currentPeriod = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
    }).replace('/', '-'); // e.g. "2026-05"

    const record = await prisma.usageRecord.create({
      data: {
        subscriptionId: subscription.id,
        metric,
        value,
        period: currentPeriod,
      },
    });

    logger.debug(`Usage tracked for company ${companyId}: ${metric} = ${value}`);
    return record;
  }
}

export const billingService = new BillingService();
