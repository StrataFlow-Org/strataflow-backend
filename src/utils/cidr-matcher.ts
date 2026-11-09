export class CidrMatcher {
  private static ipToLong(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  public static isIpInCidr(ip: string, cidr: string): boolean {
    const [range, bitsStr = '32'] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;

    const ipLong = this.ipToLong(ip);
    const rangeLong = this.ipToLong(range);

    return (ipLong & mask) === (rangeLong & mask);
  }
}
