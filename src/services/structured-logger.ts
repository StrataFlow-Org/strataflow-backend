export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
}

export class StructuredLogger {
  constructor(private readonly context: string) {}

  public log(level: LogLevel, message: string, data?: any): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
    };
    return entry;
  }

  public info(message: string, data?: any): StructuredLogEntry {
    return this.log('INFO', message, data);
  }

  public warn(message: string, data?: any): StructuredLogEntry {
    return this.log('WARN', message, data);
  }

  public error(message: string, data?: any): StructuredLogEntry {
    return this.log('ERROR', message, data);
  }
}
