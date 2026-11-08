import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { indexerService } from '../services/soroban-indexer.js';

export const agreementRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/events', async (request) => {
    const { agreementId, type, limit } = request.query as {
      agreementId?: string;
      type?: string;
      limit?: string;
    };

    const numLimit = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 50;
    const events = indexerService.getEvents(agreementId, type, numLimit);
    return { data: events, count: events.length };
  });

  fastify.get('/api/events/latest', async (request) => {
    const { type, limit } = request.query as {
      type?: string;
      limit?: string;
    };

    const numLimit = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20;
    const events = indexerService.getEvents(undefined, type, numLimit);
    return {
      success: true,
      lastLedger: indexerService.getLastLedger(),
      events,
      count: events.length,
    };
  });

  fastify.get('/api/events/:agreementId', async (request, reply) => {
    const { agreementId } = request.params as { agreementId: string };

    if (!agreementId) {
      return reply.status(400).send({ error: 'agreementId parameter required' });
    }

    const events = indexerService.getEvents(agreementId);
    return reply.send({
      agreementId,
      events,
      count: events.length,
    });
  });

  fastify.post('/api/metadata', async (request, reply) => {
    const schema = z.object({
      title: z.string().min(3),
      description: z.string(),
      milestoneDescriptions: z.array(z.string()),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error });
    }

    const mockCid = `QmStrataFlowMeta${Date.now()}`;

    return {
      success: true,
      ipfsHash: mockCid,
      metadata: parsed.data,
    };
  });
};
