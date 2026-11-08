import { FastifyPluginAsync } from 'fastify';
import { config } from '../config.js';
import { checkDatabaseHealth } from '../services/db.js';
import { indexerService } from '../services/soroban-indexer.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    const dbHealth = await checkDatabaseHealth();
    const lastLedger = indexerService.getLastLedger();

    const response = {
      status: 'ok',
      service: 'strataflow-backend',
      timestamp: new Date().toISOString(),
      network: config.STELLAR_NETWORK,
      rpc: config.SOROBAN_RPC_URL,
      database: {
        healthy: dbHealth.isHealthy,
        latencyMs: dbHealth.latencyMs,
        ...(dbHealth.error ? { error: dbHealth.error } : {}),
      },
      indexer: {
        lastLedger,
        contractId: config.STRATAFLOW_CONTRACT_ID,
      },
    };

    return reply.status(200).send(response);
  });
};
