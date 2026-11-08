import { FastifyError, FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { config } from '../config.js';

export const errorHandlerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const requestId = request.id || 'unknown';

    // 1. Zod Validation Error
    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Request payload validation failed',
        requestId,
        details: error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    // 2. Fastify Validation Error
    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
        requestId,
      });
    }

    // 3. Rate Limit Error (429)
    if (error.statusCode === 429) {
      return reply.status(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: error.message || 'Rate limit exceeded, please slow down.',
        requestId,
      });
    }

    // 4. Authentication / Authorization (401 / 403)
    if (error.statusCode === 401 || error.statusCode === 403) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.statusCode === 401 ? 'Unauthorized' : 'Forbidden',
        message: error.message,
        requestId,
      });
    }

    // 5. Not Found (404)
    if (error.statusCode === 404) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: error.message || 'Resource not found',
        requestId,
      });
    }

    // 6. Generic Internal Server Error (500)
    request.log.error({ err: error, requestId }, 'Unhandled application error');

    const isDev = config.NODE_ENV === 'development';
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: isDev ? error.message : 'An unexpected error occurred. Please contact support with requestId.',
      requestId,
      ...(isDev ? { stack: error.stack } : {}),
    });
  });
};
