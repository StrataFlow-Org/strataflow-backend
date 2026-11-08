import { FastifyPluginAsync } from 'fastify';
import { config } from '../config.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'strataflow-backend',
      timestamp: new Date().toISOString(),
      network: config.STELLAR_NETWORK,
      rpc: config.SOROBAN_RPC_URL,
    };
  });
};
