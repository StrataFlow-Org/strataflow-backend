import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { StrKey } from '@stellar/stellar-sdk';
import { sep10Service } from '../services/sep10-auth.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/auth/challenge', async (request, reply) => {
    const schema = z.object({
      publicKey: z.string().refine((val) => StrKey.isValidEd25519PublicKey(val), {
        message: 'Invalid Stellar Ed25519 public key format',
      }),
      homeDomain: z.string().optional().default('strataflow.io'),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    try {
      const challenge = sep10Service.generateChallenge(
        parsed.data.publicKey,
        parsed.data.homeDomain
      );
      return reply.send({
        success: true,
        challengeXdr: challenge.challengeXdr,
        networkPassphrase: challenge.networkPassphrase,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate challenge';
      return reply.status(500).send({ error: message });
    }
  });

  fastify.post('/api/auth/token', async (request, reply) => {
    const schema = z.object({
      publicKey: z.string().refine((val) => StrKey.isValidEd25519PublicKey(val), {
        message: 'Invalid Stellar Ed25519 public key format',
      }),
      signedXdr: z.string().min(10, 'Signed transaction XDR required'),
      homeDomain: z.string().optional().default('strataflow.io'),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    const isValid = sep10Service.verifyChallenge(
      parsed.data.publicKey,
      parsed.data.signedXdr,
      parsed.data.homeDomain
    );

    if (!isValid) {
      return reply.status(401).send({
        error: 'Invalid or expired challenge signature',
      });
    }

    const token = sep10Service.generateToken(parsed.data.publicKey);
    return reply.send({
      success: true,
      token,
      publicKey: parsed.data.publicKey,
      expiresIn: 86400,
    });
  });

  fastify.get('/api/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing Bearer authorization header' });
    }

    const token = authHeader.substring(7);
    const claims = sep10Service.verifyToken(token);

    if (!claims) {
      return reply.status(401).send({ error: 'Invalid or expired authentication token' });
    }

    return reply.send({
      authenticated: true,
      publicKey: claims.sub,
      issuedAt: new Date(claims.iat * 1000).toISOString(),
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    });
  });
};
