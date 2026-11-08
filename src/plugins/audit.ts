import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { auditLogger } from '../services/audit-logger.js';

const audit: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('onResponse', async (request, reply) => {
    // Audit log mutating requests or failed requests
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
    const isError = reply.statusCode >= 400;

    if (isMutation || isError) {
      const user = (request as any).user;
      const ip = request.ip || request.headers['x-forwarded-for']?.toString() || 'unknown';

      auditLogger.log({
        actorAddress: user?.address,
        ip,
        method: request.method,
        path: request.url,
        statusCode: reply.statusCode,
        durationMs: Math.round(reply.elapsedTime),
        details: {
          requestId: request.id,
          params: request.params,
        },
      });
    }
  });
};

export const auditHookPlugin = fp(audit, {
  name: 'strataflow-audit-hook',
});
