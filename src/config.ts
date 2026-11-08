import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  STELLAR_NETWORK: z.string().default('TESTNET'),
  SOROBAN_RPC_URL: z.string().default('https://soroban-testnet.stellar.org'),
  STRATAFLOW_CONTRACT_ID: z.string().optional(),
  STELLAR_NETWORK_PASSPHRASE: z
    .string()
    .default('Test SDF Network ; September 2015'),
  CORS_ORIGIN: z.string().default('*'),
});

export const config = envSchema.parse(process.env);
