import { z } from 'zod';
import dotenv from 'dotenv';
import crypto from 'node:crypto';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  STELLAR_NETWORK: z.string().default('TESTNET'),
  SOROBAN_RPC_URL: z.string().default('https://soroban-testnet.stellar.org'),
  STRATAFLOW_CONTRACT_ID: z.string().default('CDXVD3AA43SE2D52ZBJSH3RDKAPOYG6OCDAZGSQD6M5TCBQIG3HTLY6J'),
  STELLAR_NETWORK_PASSPHRASE: z
    .string()
    .default('Test SDF Network ; September 2015'),
  SERVER_SIGNING_KEY: z.string().optional(),
  SERVER_PUBLIC_KEY: z.string().optional(),
  JWT_SECRET: z.string().default(() => crypto.randomBytes(32).toString('hex')),
  CHALLENGE_EXPIRES_IN_SECONDS: z.coerce.number().default(300),
  CORS_ORIGIN: z.string().default('*'),
});

const parsed = envSchema.parse(process.env);

if (parsed.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('[StrataFlow Security Error]: JWT_SECRET must be explicitly provided in production environment.');
}

export const config = parsed;
