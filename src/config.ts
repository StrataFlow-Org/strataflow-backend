import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  STELLAR_NETWORK: z.string().default('TESTNET'),
  SOROBAN_RPC_URL: z.string().default('https://soroban-testnet.stellar.org'),
  STRATAFLOW_CONTRACT_ID: z.string().default('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'),
  STELLAR_NETWORK_PASSPHRASE: z
    .string()
    .default('Test SDF Network ; September 2015'),
  SERVER_SIGNING_KEY: z.string().optional(),
  SERVER_PUBLIC_KEY: z.string().optional(),
  JWT_SECRET: z.string().default('strataflow-default-secret-key-32charslong!'),
  CHALLENGE_EXPIRES_IN_SECONDS: z.coerce.number().default(300),
  CORS_ORIGIN: z.string().default('*'),
});

export const config = envSchema.parse(process.env);
