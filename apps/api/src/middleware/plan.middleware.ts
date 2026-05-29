import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import type { AuthenticatedRequest } from './auth.middleware';

/**
 * Express middleware to restrict endpoints to companies with subscription plans
 * that support a specific feature.
 * 
 * @param feature The unique string identifier of the gated feature
 */
export function requireFeature(feature: string) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const subscription = await prisma.subscription.findUnique({
        where: { companyId: req.user.companyId },
        include: { planDetails: true },
      });

      if (!subscription) {
        throw new ForbiddenError('No active subscription found for this company');
      }

      // Check subscription status
      const validStatuses = ['ACTIVE', 'TRIAL'];
      if (!validStatuses.includes(subscription.status)) {
        throw new ForbiddenError(`Your subscription is ${subscription.status.toLowerCase()}`);
      }

      // Check trial expiration
      if (subscription.status === 'TRIAL' && subscription.trialEndsAt && new Date() > subscription.trialEndsAt) {
        throw new ForbiddenError('Your trial period has expired');
      }

      // If the plan has wildcard access, let all features through
      const features = (subscription.planDetails?.features as string[]) || [];
      const hasWildcard = features.includes('*');
      const hasFeature = features.includes(feature);

      if (!hasWildcard && !hasFeature) {
        throw new ForbiddenError(
          `The '${feature}' feature is not supported in your current plan (${subscription.planDetails?.displayName || subscription.plan})`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
