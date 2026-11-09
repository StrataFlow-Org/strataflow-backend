export interface LivenessStatus {
  status: 'UP' | 'DOWN';
  uptimeSeconds: number;
  memoryUsageMb: number;
}

export interface ReadinessStatus {
  status: 'READY' | 'NOT_READY';
  checks: {
    database: boolean;
    sorobanRpc: boolean;
  };
}

export class HealthProbeService {
  public static getLiveness(): LivenessStatus {
    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
    return {
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(mem * 100) / 100,
    };
  }

  public static getReadiness(dbConnected: boolean, rpcReachable: boolean): ReadinessStatus {
    const ready = dbConnected && rpcReachable;
    return {
      status: ready ? 'READY' : 'NOT_READY',
      checks: {
        database: dbConnected,
        sorobanRpc: rpcReachable,
      },
    };
  }
}
