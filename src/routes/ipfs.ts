import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { IpfsVerifierService, formatGatewayUrl } from '../services/ipfs-verifier.js';

export const ipfsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/ipfs/verify', async (request, reply) => {
    const schema = z.object({
      cid: z.string().min(1),
      gateway: z.string().url().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Missing or invalid CID', details: parsed.error.issues });
    }

    const verification = IpfsVerifierService.verifyCid(parsed.data.cid);
    const customGatewayUrl = parsed.data.gateway
      ? formatGatewayUrl(parsed.data.cid, parsed.data.gateway)
      : verification.gatewayUrl;

    return reply.send({
      success: true,
      data: {
        ...verification,
        gatewayUrl: customGatewayUrl,
        fallbackGateways: IpfsVerifierService.getAllGatewayUrls(parsed.data.cid),
      },
    });
  });
};
