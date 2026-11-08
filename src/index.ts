import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { securityPlugin } from './plugins/security.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { auditHookPlugin } from './plugins/audit.js';
import { healthRoutes } from './routes/health.js';
import { agreementRoutes } from './routes/agreements.js';
import { authRoutes } from './routes/auth.js';
import { webhookRoutes } from './routes/webhooks.js';
import { contractRoutes } from './routes/contract.js';
import { indexerService } from './services/soroban-indexer.js';
import { webhookDispatcher } from './services/webhook-dispatcher.js';
import { setupBigIntSerialization } from './services/serializer.js';
import { disconnectDatabase } from './services/db.js';

// Setup global BigInt JSON serialization
setupBigIntSerialization();

const app = Fastify({
  bodyLimit: 1048576, // 1MB payload limit to prevent buffer exhaustion DOS
  logger: {
    level: config.NODE_ENV === 'development' ? 'info' : 'warn',
    redact: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.token',
      'req.body.jwt',
      'req.body.signedXdr',
      'req.body.secret',
    ],
  },
});

async function main() {
  // 1. Security & Header protection
  await app.register(securityPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(auditHookPlugin);

  // 2. Strict CORS with origin verification
  const allowedOrigins = config.CORS_ORIGIN.split(',').map((o) => o.trim());
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || config.CORS_ORIGIN === '*' || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`Origin ${origin} not allowed by StrataFlow CORS policy`), false);
    },
    credentials: true,
  });

  // 3. Application Routes
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(agreementRoutes);
  await app.register(webhookRoutes);
  await app.register(contractRoutes);

  // 4. Background Indexer
  await indexerService.start();

  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    indexerService.stop();
    webhookDispatcher.clear();
    await disconnectDatabase();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`🚀 StrataFlow backend listening on port ${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
