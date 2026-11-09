import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { webhookDispatcher, WebhookDispatcherService } from '../services/webhook-dispatcher.js';
import { sep10Service } from '../services/sep10-auth.js';

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/webhooks/subscribe - register new webhook URL
  fastify.post('/api/webhooks/subscribe', async (request, reply) => {
    const schema = z.object({
      url: z.string().url('A valid HTTP(S) URL is required'),
      eventTypes: z.array(z.string()).default(['*']),
      ownerAddress: z.string().min(10, 'Owner address required'),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    // SSRF Prevention Check
    const ssrfCheck = WebhookDispatcherService.isSafeWebhookUrl(parsed.data.url);
    if (!ssrfCheck.isSafe) {
      return reply.status(400).send({
        error: `SSRF Prevention: ${ssrfCheck.reason}`,
      });
    }

    try {
      const subscription = webhookDispatcher.registerSubscription(parsed.data);

      return reply.status(201).send({
        success: true,
        subscription: {
          id: subscription.id,
          url: subscription.url,
          secret: subscription.secret,
          eventTypes: subscription.eventTypes,
          ownerAddress: subscription.ownerAddress,
          createdAt: subscription.createdAt,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register webhook';
      return reply.status(400).send({ error: msg });
    }
  });

  // GET /api/webhooks - list subscriptions
  fastify.get('/api/webhooks', async (request, reply) => {
    const { ownerAddress } = request.query as { ownerAddress?: string };
    const subscriptions = webhookDispatcher.getSubscriptions(ownerAddress);

    return reply.send({
      success: true,
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        url: s.url,
        eventTypes: s.eventTypes,
        ownerAddress: s.ownerAddress,
        active: s.active,
        createdAt: s.createdAt,
      })),
      count: subscriptions.length,
    });
  });

  // DELETE /api/webhooks/:subscriptionId - delete webhook
  fastify.delete('/api/webhooks/:subscriptionId', async (request, reply) => {
    const { subscriptionId } = request.params as { subscriptionId: string };
    const sub = webhookDispatcher.getSubscription(subscriptionId);

    if (!sub) {
      return reply.status(404).send({ error: 'Subscription not found' });
    }

    // Authorization verification: verify SEP-10 Bearer JWT or X-Webhook-Secret if provided
    const authHeader = request.headers.authorization;
    const secretHeader = request.headers['x-webhook-secret'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const claims = sep10Service.verifyToken(authHeader.substring(7));
      if (!claims || claims.sub !== sub.ownerAddress) {
        return reply.status(403).send({ error: 'Unauthorized to delete this webhook subscription' });
      }
    } else if (secretHeader) {
      if (secretHeader !== sub.secret) {
        return reply.status(403).send({ error: 'Invalid webhook secret' });
      }
    }

    const deleted = webhookDispatcher.removeSubscription(subscriptionId);
    if (!deleted) {
      return reply.status(404).send({ error: 'Subscription not found' });
    }

    return reply.send({ success: true, message: 'Subscription successfully removed' });
  });

  // POST /api/webhooks/test - trigger mock test event
  fastify.post('/api/webhooks/test', async (request, reply) => {
    const schema = z.object({
      eventType: z.string().default('AgreementCreated'),
      payload: z.record(z.any()).default({ test: true, ping: 'pong' }),
    });

    const parsed = schema.safeParse(request.body || {});
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    webhookDispatcher.queueEvent(parsed.data.eventType, parsed.data.payload);

    return reply.send({
      success: true,
      message: `Test event ${parsed.data.eventType} queued for registered subscribers`,
    });
  });

  // GET /api/webhooks/deliveries - inspect delivery history
  fastify.get('/api/webhooks/deliveries', async (request, reply) => {
    const { subscriptionId } = request.query as { subscriptionId?: string };
    const deliveries = webhookDispatcher.getDeliveryHistory(subscriptionId);

    return reply.send({
      success: true,
      deliveries,
      count: deliveries.length,
    });
  });
};

