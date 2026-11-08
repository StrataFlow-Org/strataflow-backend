import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { randomUUID } from 'crypto';

export interface SecurityPluginOptions {
  enableRateLimit?: boolean;
}

const plugin: FastifyPluginAsync<SecurityPluginOptions> = async (fastify: FastifyInstance, opts) => {
  // 1. HTTP Security Headers with Helmet
  await fastify.register(helmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://horizon-testnet.stellar.org', 'https://soroban-testnet.stellar.org'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  });

  // 2. Sensible default HTTP utilities
  await fastify.register(sensible);

  // 3. Global Rate Limiter (100 req/min default)
  if (opts.enableRateLimit !== false) {
    await fastify.register(rateLimit, {
      global: true,
      max: 100,
      timeWindow: '1 minute',
      allowList: ['127.0.0.1'],
      errorResponseBuilder: (_req, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      }),
    });
  }

  // 4. Request ID Tracing Hook
  fastify.addHook('onRequest', async (request, reply) => {
    const existingId = request.headers['x-request-id'];
    const reqId = typeof existingId === 'string' && existingId.trim() ? existingId : randomUUID();
    request.id = reqId;
    reply.header('x-request-id', reqId);
  });
};

export const securityPlugin = fp(plugin, {
  name: 'strataflow-security',
});
