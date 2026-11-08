import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { healthRoutes } from './routes/health.js';
import { agreementRoutes } from './routes/agreements.js';
import { indexerService } from './services/soroban-indexer.js';

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
  await app.register(agreementRoutes);

  await indexerService.start();

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`🚀 StrataFlow backend listening on port ${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

