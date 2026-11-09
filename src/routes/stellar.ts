import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { StrKey } from '@stellar/stellar-sdk';
import { horizonService, getNativeXlmBalance } from '../services/horizon-service.js';

const ED25519_REGEX = /^G[A-Z2-7]{55}$/;

export const stellarRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/stellar/account/:publicKey
  fastify.get('/api/stellar/account/:publicKey', async (request, reply) => {
    const { publicKey } = request.params as { publicKey: string };

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
};
