import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { indexerService } from '../services/soroban-indexer.js';

export const agreementRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/events', async (request) => {
    const { agreementId } = request.query as { agreementId?: string };
    const events = indexerService.getEvents(agreementId);
    return { data: events, count: events.length };
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

    // Mock IPFS CID hash generation
    const mockCid = `QmStrataFlowMeta${Date.now()}`;

    return {
      success: true,
      ipfsHash: mockCid,
      metadata: parsed.data,
    };
  });
};

