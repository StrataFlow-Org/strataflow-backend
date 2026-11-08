import { z } from 'zod';
import { StrKey } from '@stellar/stellar-sdk';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1000).max(65535).default(3001),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('*'),
  STELLAR_NETWORK: z.enum(['TESTNET', 'MAINNET', 'FUTURENET', 'testnet', 'mainnet', 'futurenet', 'PUBLIC', 'public']).default('TESTNET'),
  SOROBAN_RPC_URL: z.string().url().default('https://soroban-testnet.stellar.org'),
  HORIZON_URL: z.string().url().default('https://horizon-testnet.stellar.org'),
  STRATAFLOW_CONTRACT_ID: z
    .string()
    .refine((val) => StrKey.isValidContract(val), {
      message: 'STRATAFLOW_CONTRACT_ID must be a valid 56-character StrKey contract ID starting with C',
    })
    .default('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4'),
  SERVER_SECRET_KEY: z
    .string()
    .refine((val) => StrKey.isValidEd25519SecretSeed(val), {
      message: 'SERVER_SECRET_KEY must be a valid Stellar secret seed starting with S',
    })
    .default('SCBSOLSZRRLUP23G4ZI6IBDRV5MXTLNESTJWH7XDE7SHHB6KOI4VGZED'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters for cryptographic HMAC strength')
    .default('strataflow-production-jwt-super-secret-key-32chars!'),
  DATABASE_URL: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

export class EnvironmentValidator {
  public static validate(rawEnv: Record<string, unknown> = process.env): ValidatedEnv {
    const result = EnvSchema.safeParse(rawEnv);

    if (!result.success) {
      const formattedErrors = result.error.issues
        .map((issue) => `  - [${issue.path.join('.')}]: ${issue.message}`)
        .join('\n');

      throw new Error(
        `[StrataFlow Fatal]: Environment configuration validation failed:\n${formattedErrors}`
      );
    }

    // Additional security checks for production
    if (result.data.NODE_ENV === 'production') {
      if (result.data.JWT_SECRET.length < 32) {
        throw new Error('[StrataFlow Security Error]: JWT_SECRET must be at least 32 characters in production.');
      }
      if (result.data.CORS_ORIGIN === '*') {
        console.warn('[StrataFlow Security Warning]: CORS_ORIGIN is wildcard (*) in production environment.');
      }
    }

    return result.data;
  }
}
