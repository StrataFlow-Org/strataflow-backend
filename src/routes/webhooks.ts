import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { webhookDispatcher, WebhookDispatcherService } from '../services/webhook-dispatcher.js';

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

    if (!WebhookDispatcherService.isSafeUrl(parsed.data.url)) {
      return reply.status(400).send({ error: 'Destination webhook URL is invalid or targets a restricted host' });
    }

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
    const deleted = webhookDispatcher.removeSubscription(subscriptionId);

    if (!deleted) {
      return reply.status(404).send({ error: 'Subscription not found' });
    }

    return reply.send({ success: true, message: 'Subscription successfully removed' });
  });


  // GET /api/webhooks/deliveries - inspect delivery history
  fastify.get('/api/webhooks/deliveries', async (req, reply) => {
    const { subscriptionId, limit } = req.query as { subscriptionId?: string; limit?: string };
    const numLimit = limit ? parseInt(limit, 10) : 50;
    const history = webhookDispatcher.getRecentDeliveries(numLimit, subscriptionId);
    return reply.send({
      success: true,
      data: history,
      count: history.length,
    });
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

