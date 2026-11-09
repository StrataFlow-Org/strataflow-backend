export interface CorsConfig {
  origin: string[] | string;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
}

export function getCorsConfig(env: NodeJS.ProcessEnv = process.env): CorsConfig {
  const allowedOriginsRaw = env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,https://strataflow.org';
  const origins = allowedOriginsRaw.split(',').map(o => o.trim()).filter(Boolean);

  return {
    origin: origins.length === 1 && origins[0] === '*' ? '*' : origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Correlation-ID',
      'X-Signature',
      'X-Timestamp',
    ],
    exposedHeaders: ['X-Request-ID', 'X-Correlation-ID', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400,
  };
}
