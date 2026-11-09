export interface TokenMetadata {
  code: string;
  name: string;
  contractAddress: string;
  decimals: number;
  isNative: boolean;
  issuer?: string;
}

export class TokenRegistryService {
  private static TOKENS: TokenMetadata[] = [
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      contractAddress: 'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
      decimals: 7,
      isNative: true,
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      contractAddress: 'CBIELTK6YBZJU5UP2WWQEUCYJLPU6QXOC4Z4V75N2YSRN7RCRD66N6E2',
      decimals: 7,
      isNative: false,
      issuer: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
    },
  ];

  public static getSupportedTokens(): TokenMetadata[] {
    return this.TOKENS;
  }

  public static findByContractAddress(address: string): TokenMetadata | undefined {
    return this.TOKENS.find((t) => t.contractAddress === address);
  }
}
