export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorAddress?: string;
  ip: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  action?: string;
  details?: Record<string, unknown>;
}

export class AuditLoggerService {
  private logEntries: AuditLogEntry[] = [];
  private readonly maxMemoryEntries = 5000;

  public log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...entry,
      details: entry.details ? this.sanitizeDetails(entry.details) : undefined,
    };

    this.logEntries.unshift(fullEntry);
    if (this.logEntries.length > this.maxMemoryEntries) {
      this.logEntries.pop();
    }

    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `[AUDIT] ${fullEntry.timestamp} | ${fullEntry.method} ${fullEntry.path} | status: ${fullEntry.statusCode} | actor: ${fullEntry.actorAddress || 'anonymous'} | ip: ${fullEntry.ip}`
      );
    }

    return fullEntry;
  }

  public getRecentLogs(limit: number = 50, actorAddress?: string): AuditLogEntry[] {
    let result = this.logEntries;
    if (actorAddress) {
      result = result.filter((e) => e.actorAddress === actorAddress);
    }
    return result.slice(0, limit);
  }

  public sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'signature', 'privatekey', 'jwt'];

    for (const [key, value] of Object.entries(details)) {
      const lower = key.toLowerCase();
      if (sensitiveKeys.some((s) => lower.includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeDetails(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  public clear(): void {
    this.logEntries = [];
  }
}

export const auditLogger = new AuditLoggerService();
