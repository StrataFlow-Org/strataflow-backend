import { randomBytes } from 'crypto';

export interface TraceContext {
  traceId: string;
  spanId: string;
  correlationId: string;
}

export class RequestTracer {
  public static generateTraceId(): string {
    return randomBytes(16).toString('hex');
  }

  public static generateSpanId(): string {
    return randomBytes(8).toString('hex');
  }

  public static createTraceContext(incomingCorrelationId?: string): TraceContext {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const correlationId = incomingCorrelationId?.trim() || `corr_${Date.now()}_${randomBytes(4).toString('hex')}`;

    return { traceId, spanId, correlationId };
  }

  public static formatTraceparent(traceId: string, spanId: string): string {
    return `00-${traceId}-${spanId}-01`;
  }
}
