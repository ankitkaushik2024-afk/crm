import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import type { SubscriptionStatus, SubscriptionPlan } from '@prisma/client';

export class SubscriptionService {
  /**
   * List all available billing plans
   */
  async getPlans() {
    return prisma.plan.findMany({
      orderBy: { monthlyPrice: 'asc' },
    });
  }

  /**
   * Get active subscription details for a company
   */
  async getCurrentSubscription(companyId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
      include: { planDetails: true },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found for this company');
    }

    return subscription;
  }

  /**
   * Create a new trial subscription for a company
   */
  async createTrialSubscription(companyId: string, planName: string = 'STARTER') {
    // Find the requested plan details
    const plan = await prisma.plan.findUnique({
      where: { name: planName },
    });

    if (!plan) {
      throw new NotFoundError(`Plan ${planName} not found`);
    }

    const trialDays = 14;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const subscriptionPlanEnumMapping: Record<string, SubscriptionPlan> = {
      FREE: 'FREE',
      STARTER: 'STARTER',
      PROFESSIONAL: 'PROFESSIONAL',
      ENTERPRISE: 'ENTERPRISE',
    };

    const subscription = await prisma.subscription.upsert({
      where: { companyId },
      update: {
        planId: plan.id,
        plan: subscriptionPlanEnumMapping[planName] || 'STARTER',
        status: 'TRIAL',
        maxUsers: plan.maxUsers,
        maxProjects: plan.maxProjects,
        trialEndsAt,
        renewsAt: null,
      },
      create: {
        companyId,
        planId: plan.id,
        plan: subscriptionPlanEnumMapping[planName] || 'STARTER',
        status: 'TRIAL',
        maxUsers: plan.maxUsers,
        maxProjects: plan.maxProjects,
        trialEndsAt,
      },
      include: { planDetails: true },
    });

    logger.info(`Trial subscription created for company ${companyId} under plan ${planName}`);
    return subscription;
  }

  /**
   * Upgrade or modify an existing subscription plan
   */
  async upgradeSubscription(
    companyId: string,
    planId: string,
    stripeSubscriptionId?: string
  ) {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    const subscriptionPlanEnumMapping: Record<string, SubscriptionPlan> = {
      FREE: 'FREE',
      STARTER: 'STARTER',
      PROFESSIONAL: 'PROFESSIONAL',
      ENTERPRISE: 'ENTERPRISE',
    };

    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1); // Monthly renewal

    const subscription = await prisma.subscription.update({
      where: { companyId },
      data: {
        planId: plan.id,
        plan: subscriptionPlanEnumMapping[plan.name] || 'STARTER',
        status: 'ACTIVE',
        maxUsers: plan.maxUsers,
        maxProjects: plan.maxProjects,
        trialEndsAt: null,
        renewsAt,
        stripeSubscriptionId: stripeSubscriptionId || null,
      },
      include: { planDetails: true },
    });

    logger.info(`Subscription upgraded for company ${companyId} to plan ${plan.name}`);
    return subscription;
  }

  /**
   * Cancel an active subscription
   */
  async cancelSubscription(companyId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    const updated = await prisma.subscription.update({
      where: { companyId },
      data: {
        status: 'CANCELLED',
        renewsAt: null,
      },
      include: { planDetails: true },
    });

    logger.info(`Subscription cancelled for company ${companyId}`);
    return updated;
  }
}

export const subscriptionService = new SubscriptionService();
