import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { healthRoutes } from './routes/health.js';
import { agreementRoutes } from './routes/agreements.js';
import { authRoutes } from './routes/auth.js';
import { indexerService } from './services/soroban-indexer.js';
import { setupBigIntSerialization } from './services/serializer.js';
import { disconnectDatabase } from './services/db.js';

// Setup global BigInt JSON serialization
setupBigIntSerialization();

const app = Fastify({
  logger: {
    level: config.NODE_ENV === 'development' ? 'info' : 'warn',
  },
});

async function main() {
  await app.register(cors, {
    origin: config.CORS_ORIGIN,
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(agreementRoutes);

  await indexerService.start();

  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    indexerService.stop();
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
