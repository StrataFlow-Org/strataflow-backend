export class IpBlacklistService {
  private bannedIps: Map<string, number> = new Map();
  private bannedSubnets: string[] = [];

  public banIp(ip: string, ttlMs: number = 3600000): void {
    const expiresAt = Date.now() + ttlMs;
    this.bannedIps.set(ip.trim(), expiresAt);
  }

  public addSubnetBlock(subnetCidr: string): void {
    this.bannedSubnets.push(subnetCidr.trim());
  }

  public isBanned(ip: string): boolean {
    const cleanIp = ip.trim();
    const expiry = this.bannedIps.get(cleanIp);
    if (expiry !== undefined) {
      if (Date.now() < expiry) {
        return true;
      }
      this.bannedIps.delete(cleanIp);
    }

    return this.bannedSubnets.some(subnet => cleanIp.startsWith(subnet.split('/')[0].split('.').slice(0, 3).join('.')));
  }

  public unbanIp(ip: string): void {
    this.bannedIps.delete(ip.trim());
  }
}
