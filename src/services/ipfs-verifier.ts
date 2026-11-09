export interface IpfsVerificationResult {
  isValid: boolean;
  version: 'v0' | 'v1' | 'unknown';
  gatewayUrl: string;
  cid: string;
  fallbackGateways: string[];
  error?: string;
}

export class IpfsVerifierService {
  private static IPFS_V0_REGEX = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  private static IPFS_V1_REGEX = /^bafy[a-z0-9]{55,}$/;

  public static readonly DEFAULT_GATEWAYS: readonly string[] = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
  ];

  public static getAllGatewayUrls(cidOrUri: string): string[] {
    const rawCid = cidOrUri.replace(/^ipfs:\/\//, '').trim();
    if (!this.IPFS_V0_REGEX.test(rawCid) && !this.IPFS_V1_REGEX.test(rawCid)) {
      return [];
    }
    return this.DEFAULT_GATEWAYS.map((gw) => `${gw}${rawCid}`);
  }

  public static verifyCid(cidOrUri: string): IpfsVerificationResult {
    const rawCid = cidOrUri.replace(/^ipfs:\/\//, '').trim();

    if (this.IPFS_V0_REGEX.test(rawCid)) {
      return {
        isValid: true,
        version: 'v0',
        cid: rawCid,
        gatewayUrl: `https://ipfs.io/ipfs/${rawCid}`,
        fallbackGateways: this.getAllGatewayUrls(rawCid),
      };
    }

    if (this.IPFS_V1_REGEX.test(rawCid)) {
      return {
        isValid: true,
        version: 'v1',
        cid: rawCid,
        gatewayUrl: `https://${rawCid}.ipfs.dweb.link`,
        fallbackGateways: this.getAllGatewayUrls(rawCid),
      };
    }

    return {
      isValid: false,
      version: 'unknown',
      cid: rawCid,
      gatewayUrl: '',
      fallbackGateways: [],
      error: 'Invalid IPFS CID format (must match v0 Qm... or v1 bafy...)',
    };
  }
}

export function formatGatewayUrl(cidOrUri: string, preferredGateway = 'https://ipfs.io/ipfs/'): string {
  const result = IpfsVerifierService.verifyCid(cidOrUri);
  if (!result.isValid) return '';
  return `${preferredGateway.replace(/\/$/, '')}/${result.cid}`;
}
