import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/plan.middleware';
import { subscriptionController } from '../controllers/subscription.controller';

const router = Router();

// Stripe Webhook endpoint - must be public (no session authentication)
router.post('/webhook', (req, res, next) => subscriptionController.handleStripeWebhook(req, res).catch(next));

// All other endpoints require authentication
router.use(authenticate);

/**
 * GET /api/v1/subscriptions/plans
 * List all pricing tiers
 */
router.get('/plans', (req, res, next) => subscriptionController.getPlans(req, res).catch(next));

/**
 * GET /api/v1/subscriptions/current
 * Fetch active subscription billing info
 */
router.get('/current', (req, res, next) => subscriptionController.getCurrentSubscription(req, res).catch(next));

/**
 * POST /api/v1/subscriptions/checkout
 * Start simulated Stripe checkout session
 */
router.post('/checkout', (req, res, next) => subscriptionController.createCheckoutSession(req, res).catch(next));

/**
 * GET /api/v1/subscriptions/invoices
 * Get invoices payment history
 */
router.get('/invoices', (req, res, next) => subscriptionController.getInvoices(req, res).catch(next));

/**
 * POST /api/v1/subscriptions/cancel
 * Cancel active renewal
 */
router.post('/cancel', (req, res, next) => subscriptionController.cancelSubscription(req, res).catch(next));

/**
 * GET /api/v1/subscriptions/ai/leaves
 * Predict company leave patterns (gated to premium subscription tiers)
 */
router.get(
  '/ai/leaves',
  requireFeature('ai_insights'),
  (req, res, next) => subscriptionController.getAILeavePredictions(req, res).catch(next)
);

/**
 * GET /api/v1/subscriptions/ai/projects/:projectId/team
 * Generate optimal team recommendations (gated to premium subscription tiers)
 */
router.get(
  '/ai/projects/:projectId/team',
  requireFeature('ai_insights'),
  (req, res, next) => subscriptionController.getAITeamComposition(req, res).catch(next)
);

export default router;
