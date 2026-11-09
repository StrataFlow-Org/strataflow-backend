import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { StrKey } from '@stellar/stellar-sdk';
import { horizonService, getNativeXlmBalance } from '../services/horizon-service.js';
import { config } from '../config.js';

const ED25519_REGEX = /^G[A-Z2-7]{55}$/;

const STELLAR_TOML_CONTENT = `# SEP-0001: StrataFlow Protocol stellar.toml
VERSION="2.0.0"

[DOCUMENTATION]
ORG_NAME="StrataFlow Protocol"
ORG_URL="https://strataflow.network"
ORG_DESCRIPTION="Decentralized autonomous milestone escrow protocol on Stellar and Soroban"
ORG_OFFICIAL_EMAIL="security@strataflow.network"
ORG_GITHUB="https://github.com/StrataFlow-Org"

[[PRINCIPALS]]
NAME="Winningtalker"
EMAIL="321662467+winningtalker-commits@users.noreply.github.com"

[NETWORK_PASSPHRASE]
TESTNET="Test SDF Network ; September 2015"
PUBLIC="Public Global Stellar Network ; September 2015"

[ACCOUNTS]
ACCOUNTS=["GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS"]

[CONTRACTS]
STRATAFLOW_ESCROW="${config.STRATAFLOW_CONTRACT_ID}"
`;

export const stellarRoutes: FastifyPluginAsync = async (fastify) => {
  // SEP-0001: Discoverability & Metadata endpoint
  fastify.get('/.well-known/stellar.toml', async (_request, reply) => {
    return reply
      .header('Content-Type', 'text/plain; charset=utf-8')
      .header('Access-Control-Allow-Origin', '*')
      .send(STELLAR_TOML_CONTENT);
  });

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
