export interface IpfsVerificationResult {
  isValid: boolean;
  version: 'v0' | 'v1' | 'unknown';
  gatewayUrl: string;
  cid: string;
  error?: string;
}

export class IpfsVerifierService {
  private static IPFS_V0_REGEX = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  private static IPFS_V1_REGEX = /^bafy[a-z0-9]{55,}$/;

  public static verifyCid(cidOrUri: string): IpfsVerificationResult {
    const rawCid = cidOrUri.replace(/^ipfs:\/\//, '').trim();

    if (this.IPFS_V0_REGEX.test(rawCid)) {
      return {
        isValid: true,
        version: 'v0',
        cid: rawCid,
        gatewayUrl: `https://ipfs.io/ipfs/${rawCid}`,
      };
    }

    if (this.IPFS_V1_REGEX.test(rawCid)) {
      return {
        isValid: true,
        version: 'v1',
        cid: rawCid,
        gatewayUrl: `https://${rawCid}.ipfs.dweb.link`,
      };
    }

    return {
      isValid: false,
      version: 'unknown',
      cid: rawCid,
      gatewayUrl: '',
      error: 'Invalid IPFS CID format (must match v0 Qm... or v1 bafy...)',
    };
  }
}

export function formatGatewayUrl(cidOrUri: string, preferredGateway = 'https://ipfs.io/ipfs/'): string {
  const result = IpfsVerifierService.verifyCid(cidOrUri);
  if (!result.isValid) return '';
  return `${preferredGateway.replace(/\/$/, '')}/${result.cid}`;
}
