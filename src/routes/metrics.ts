import { FastifyInstance } from 'fastify';
import { PrometheusFormatter } from '../services/prometheus-formatter';
import { HeapMonitor } from '../services/heap-monitor';

export async function metricsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/metrics', async (_req, reply) => {
    let output = '';
    output += PrometheusFormatter.formatGauge('process_uptime_seconds', 'Process uptime in seconds', Math.floor(process.uptime()));
    output += PrometheusFormatter.formatGauge('process_heap_usage_percent', 'Current process heap usage percentage', HeapMonitor.getHeapUsagePercentage());
    output += PrometheusFormatter.formatGauge('process_heap_used_bytes', 'Process heap used in bytes', process.memoryUsage().heapUsed);

    return reply
      .header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
      .status(200)
      .send(output);
  });
}
