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

