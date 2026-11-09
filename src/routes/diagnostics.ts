import { FastifyInstance } from 'fastify';

export async function diagnosticsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/diagnostics', async (_req, reply) => {
    return reply.status(200).send({
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptimeSeconds: Math.floor(process.uptime()),
      env: process.env.NODE_ENV || 'development',
      network: process.env.STELLAR_NETWORK || 'TESTNET',
    });
  });
}
