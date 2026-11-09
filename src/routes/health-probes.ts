import { FastifyInstance } from 'fastify';
import { HealthProbeService } from '../services/health-probes';

export async function healthProbeRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/healthz/live', async (_req, reply) => {
    const liveness = HealthProbeService.getLiveness();
    return reply.status(200).send(liveness);
  });

  fastify.get('/healthz/ready', async (_req, reply) => {
    // Basic readiness probe
    const readiness = HealthProbeService.getReadiness(true, true);
    return reply.status(readiness.status === 'READY' ? 200 : 503).send(readiness);
  });
}
