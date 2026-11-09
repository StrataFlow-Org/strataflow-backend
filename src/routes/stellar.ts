import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { StrKey } from '@stellar/stellar-sdk';
import { horizonService, getNativeXlmBalance } from '../services/horizon-service.js';

const ED25519_REGEX = /^G[A-Z2-7]{55}$/;

export const stellarRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/stellar/account/:publicKey
  fastify.get('/api/stellar/account/:publicKey', async (request, reply) => {
    const { publicKey } = request.params as { publicKey: string 
  // POST /api/stellar/simulate - preflight simulation
  fastify.post('/api/stellar/simulate', async (request, reply) => {
    const bodySchema = z.object({
      transactionXdr: z.string().min(1),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Missing or invalid transactionXdr', details: parsed.error.issues });
    }

    const { transactionXdr } = parsed.data;
    const { simulationService, estimateMaxResourceFee } = await import('../services/tx-simulation.js');
    const simResult = await simulationService.simulateTransactionXdr(transactionXdr);

    return reply.send({
      success: true,
      data: {
        ...simResult,
        suggestedMaxResourceFee: estimateMaxResourceFee(simResult.minResourceFee),
      },
    });
  });

};

    if (!StrKey.isValidEd25519PublicKey(publicKey) || !ED25519_REGEX.test(publicKey)) {
      return reply.status(400).send({ error: 'Invalid Stellar Ed25519 public key' });
    }

    const telemetry = await horizonService.getAccountTelemetry(publicKey);
    if (!telemetry) {
      return reply.status(404).send({ error: 'Account not found on Stellar network' });
    }

    return reply.send({
      success: true,
      data: {
        ...telemetry,
        nativeBalance: getNativeXlmBalance(telemetry),
      },
    });
  });

  // POST /api/stellar/simulate - preflight simulation
  fastify.post('/api/stellar/simulate', async (request, reply) => {
    const bodySchema = z.object({
      transactionXdr: z.string().min(1),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Missing or invalid transactionXdr', details: parsed.error.issues });
    }

    const { transactionXdr } = parsed.data;
    const { simulationService, estimateMaxResourceFee } = await import('../services/tx-simulation.js');
    const simResult = await simulationService.simulateTransactionXdr(transactionXdr);

    return reply.send({
      success: true,
      data: {
        ...simResult,
        suggestedMaxResourceFee: estimateMaxResourceFee(simResult.minResourceFee),
      },
    });
  });

};

// Ed25519 public key format validated
