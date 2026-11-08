export class IpFilterService {
  private denylist: Set<string> = new Set();
  private allowlist: Set<string> = new Set();

  constructor() {
    // Default allowed local development IPs
    this.allowlist.add('127.0.0.1');
    this.allowlist.add('::1');
  }

  public blockIp(ip: string): void {
    this.denylist.add(ip.trim());
  }

  public unblockIp(ip: string): void {
    this.denylist.delete(ip.trim());
  }

  public allowIp(ip: string): void {
    this.allowlist.add(ip.trim());
  }

  public isIpBlocked(ip: string): boolean {
    const cleanIp = ip.replace(/^::ffff:/, '').trim();
    return this.denylist.has(cleanIp) || this.denylist.has(ip);
  }

  public isIpAllowed(ip: string): boolean {
    const cleanIp = ip.replace(/^::ffff:/, '').trim();
    if (this.allowlist.size === 0) return true;
    return this.allowlist.has(cleanIp) || this.allowlist.has(ip);
  }
}

export const ipFilter = new IpFilterService();

