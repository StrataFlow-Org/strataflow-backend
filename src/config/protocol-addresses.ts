import { StrKey } from '@stellar/stellar-sdk';

export interface NetworkProtocolConfig {
  network: string;
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
  nativeTokenContract: string;
  usdcTokenContract: string;
}

export const PROTOCOL_NETWORKS: Record<string, NetworkProtocolConfig> = {
  TESTNET: {
    network: 'TESTNET',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    contractId:
      process.env.STRATAFLOW_CONTRACT_ID ||
      'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
    nativeTokenContract:
      process.env.NATIVE_TOKEN_CONTRACT ||
      'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
    usdcTokenContract:
      process.env.USDC_TOKEN_CONTRACT ||
      'CBIELTK6YBZJU5UP2WWQEUCYJLPU6QXOC4Z4V75N2YSRN7RCRD66N6E2',
  },
  FUTURENET: {
    network: 'FUTURENET',
    rpcUrl: 'https://rpc-futurenet.stellar.org',
    networkPassphrase: 'Test SDF Future Network ; October 2022',
    contractId: process.env.STRATAFLOW_CONTRACT_ID || 'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
    nativeTokenContract: 'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
    usdcTokenContract: '',
  },
  MAINNET: {
    network: 'MAINNET',
    rpcUrl: 'https://soroban-rpc.mainnet.stellar.org',
    networkPassphrase: 'Public Global Stellar Network ; July 2015',
    contractId: process.env.STRATAFLOW_CONTRACT_ID || 'CCW6U2NTRWVRJ22SZ7U4Y3T52TUGV7DMW5X42J7E7W2Q7U6U4N5X6Y7Z',
    nativeTokenContract: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2SLH34QDUST',
    usdcTokenContract: 'CCW6U2NTRWVRJ22SZ7U4Y3T52TUGV7DMW5X42J7E7W2Q7U6U4N5X6Y7Z',
  },
};

export class ProtocolAddressRegistry {
  public static getActiveConfig(networkName?: string): NetworkProtocolConfig {
    let key = (networkName || process.env.STELLAR_NETWORK || 'TESTNET').toUpperCase();
    if (key === 'PUBLIC') key = 'MAINNET';

    const config = PROTOCOL_NETWORKS[key] || PROTOCOL_NETWORKS.TESTNET;

    // Override contract ID if explicitly provided in environment
    if (process.env.STRATAFLOW_CONTRACT_ID) {
      return {
        ...config,
        contractId: process.env.STRATAFLOW_CONTRACT_ID,
      };
    }

    return config;
  }

  public static isValidContractAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;
    try {
      return StrKey.isValidContract(address);
    } catch {
      return false;
    }
  }

  public static assertValidContractAddress(address: string, label: string = 'Contract Address'): void {
    if (!this.isValidContractAddress(address)) {
      throw new Error(`Invalid Soroban ${label}: "${address}". Expected valid StrKey C... identifier.`);
    }
  }
}

