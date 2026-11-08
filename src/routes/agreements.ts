import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AgreementStatus } from '@prisma/client';
import { indexerService } from '../services/soroban-indexer.js';
import { agreementRepo } from '../repositories/agreement-repo.js';

export const agreementRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/agreements - query agreements with filter and pagination
  fastify.get('/api/agreements', async (request, reply) => {
    const querySchema = z.object({
      clientAddress: z.string().optional(),
      providerAddress: z.string().optional(),
      status: z.nativeEnum(AgreementStatus).optional(),
      limit: z.coerce.number().min(1).max(100).default(20),
      offset: z.coerce.number().min(0).default(0),
    });

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query parameters', details: parsed.error.issues });
    }

    const result = await agreementRepo.getAgreements(parsed.data);
    return reply.send({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  });

  // GET /api/agreements/:onChainId - get single agreement with milestones and events
  fastify.get('/api/agreements/:onChainId', async (request, reply) => {
    const { onChainId } = request.params as { onChainId: string };

    try {
      const idBigInt = BigInt(onChainId);
      const agreement = await agreementRepo.getAgreementByOnChainId(idBigInt);

      if (!agreement) {
        return reply.status(404).send({ error: 'Agreement not found' });
      }

      return reply.send({
        success: true,
        data: agreement,
      });
    } catch {
      return reply.status(400).send({ error: 'Invalid agreement ID format' });
    }
  });

  // GET /api/stats - platform escrow metrics
  fastify.get('/api/stats', async (_request, reply) => {
    const stats = await agreementRepo.getStats();
    return reply.send({
      success: true,
      stats,
    });
  });

  // Existing event indexer endpoints
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
