import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { contractClient } from '../services/contract-client';
import { TtlMonitorService } from '../services/ttl-monitor';
import { ProtocolAddressRegistry } from '../config/protocol-addresses';

export async function contractRoutes(fastify: FastifyInstance) {
  // Protocol on-chain metadata
  fastify.get('/api/contract/info', async (_req: FastifyRequest, reply: FastifyReply) => {
    const netConfig = contractClient.getNetworkConfig();
    const version = await contractClient.getVersion();
    const isPaused = await contractClient.isPaused();

    return reply.send({
      success: true,
      data: {
        contractId: netConfig.contractId,
        network: netConfig.network,
        rpcUrl: netConfig.rpcUrl,
        version,
        isPaused,
        tokens: {
          native: netConfig.nativeTokenContract,
          usdc: netConfig.usdcTokenContract,
        },
      },
    });
  });

  // Protocol operational metrics
  fastify.get('/api/contract/metrics', async (_req: FastifyRequest, reply: FastifyReply) => {
    const metrics = await contractClient.getProtocolMetrics();
    return reply.send({ success: true, data: metrics });
  });

  // Token custody balance held by contract
  fastify.get(
    '/api/contract/custody/:tokenAddress',
    async (req: FastifyRequest<{ Params: { tokenAddress: string } }>, reply: FastifyReply) => {
      const balance = await contractClient.getTokenCustodyBalance(req.params.tokenAddress);
      return reply.send({ success: true, data: { tokenAddress: req.params.tokenAddress, balance } });
    }
  );

  // Remaining dispute window
  fastify.get(
    '/api/contract/dispute-window/:agreementId',
    async (req: FastifyRequest<{ Params: { agreementId: string } }>, reply: FastifyReply) => {
      try {
        const id = BigInt(req.params.agreementId);
        const remainingSeconds = await contractClient.getDisputeWindowRemaining(id);
        return reply.send({ success: true, data: { agreementId: req.params.agreementId, remainingSeconds } });
      } catch {
        return reply.status(400).send({ error: 'Invalid agreement ID format' });
      }
    }
  );


  // GET /api/contract/reconciliation/:agreementId - solvency audit
  fastify.get(
    '/api/contract/reconciliation/:agreementId',
    async (req: FastifyRequest<{ Params: { agreementId: string } }>, reply: FastifyReply) => {
      try {
        const id = BigInt(req.params.agreementId);
        const { EscrowReconciliationService } = await import('../services/reconciliation.js');
        const audit = await EscrowReconciliationService.auditAgreement(id);
        if (!audit) {
          return reply.status(404).send({ error: 'Agreement not found for reconciliation' });
        }
        return reply.send({ success: true, data: audit });
      } catch {
        return reply.status(400).send({ error: 'Invalid agreement ID format' });
      }
    }
  );

  // Protocol fee configuration
  fastify.get('/api/contract/fees', async (_req: FastifyRequest, reply: FastifyReply) => {
    const feeConfig = await contractClient.getProtocolFee();
    return reply.send({
      success: true,
      data: feeConfig,
    });
  });

  // Storage TTL health check for an agreement
  fastify.get(
    '/api/contract/ttl/:agreementId',
    async (
      req: FastifyRequest<{ Params: { agreementId: string }; Querystring: { currentLedger?: string; liveUntilLedger?: string } }>,
      reply: FastifyReply
    ) => {
      const { agreementId } = req.params;
      const currentLedger = Number(req.query.currentLedger || '540000');
      const liveUntilLedger = Number(req.query.liveUntilLedger || '640000');

      const evaluation = TtlMonitorService.evaluateTtl(
        BigInt(agreementId),
        currentLedger,
        liveUntilLedger
      );

      return reply.send({
        success: true,
        data: {
          ...evaluation,
          agreementId: evaluation.agreementId.toString(),
          remainingDays: TtlMonitorService.ledgersToDays(evaluation.remainingLedgers),
        },
      });
    }
  );
}

