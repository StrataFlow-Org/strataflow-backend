export class PrometheusFormatter {
  public static formatGauge(name: string, help: string, value: number, labels?: Record<string, string>): string {
    const labelStr = labels
      ? '{' + Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',') + '}'
      : '';
    return `# HELP ${name} ${help}\n# TYPE ${name} gauge\n${name}${labelStr} ${value}\n`;
  }

  public static formatCounter(name: string, help: string, value: number, labels?: Record<string, string>): string {
    const labelStr = labels
      ? '{' + Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',') + '}'
      : '';
    return `# HELP ${name} ${help}\n# TYPE ${name} counter\n${name}${labelStr} ${value}\n`;
  }
}
