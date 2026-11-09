import { FastifyPluginAsync } from 'fastify';
import { config } from '../config.js';
import { checkDatabaseHealth } from '../services/db.js';
import { indexerService } from '../services/soroban-indexer.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    const dbHealth = await checkDatabaseHealth();
    const lastLedger = indexerService.getLastLedger();
    const rpcProbeStart = Date.now();
    let rpcLatencyMs = 0;
    try {
      await fetch(config.SOROBAN_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
        signal: AbortSignal.timeout(1500),
      });
      rpcLatencyMs = Date.now() - rpcProbeStart;
    } catch {
      rpcLatencyMs = -1;
    }

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
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        rpcLatencyMs,
      },
      telemetry: {
        contractId: config.STRATAFLOW_CONTRACT_ID,
        network: config.STELLAR_NETWORK,
        environment: config.NODE_ENV,
      },
      indexer: {
        lastLedger,
        contractId: config.STRATAFLOW_CONTRACT_ID,
      },
    };

    return reply.status(200).send(response);
  });
};
