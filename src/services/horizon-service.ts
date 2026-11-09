import { Horizon } from '@stellar/stellar-sdk';
import { ProtocolAddressRegistry, NetworkProtocolConfig } from '../config/protocol-addresses.js';

export interface AccountBalanceInfo {
  asset: string;
  balance: string;
  issuer?: string;
}

export interface AccountTelemetry {
  accountId: string;
  sequence: string;
  balances: AccountBalanceInfo[];
  subentryCount: number;
}

export class StellarHorizonService {
  private server: Horizon.Server;
  private config: NetworkProtocolConfig;

  constructor(network?: string) {
    this.config = ProtocolAddressRegistry.getActiveConfig(network);
    const horizonUrl = this.config.horizonUrl || 'https://horizon-testnet.stellar.org';
    this.server = new Horizon.Server(horizonUrl);
  }

  public async getAccountTelemetry(publicKey: string): Promise<AccountTelemetry | null> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const balances: AccountBalanceInfo[] = account.balances.map((b) => ({
        asset: b.asset_type === 'native' ? 'XLM' : `${b.asset_code}:${b.asset_issuer}`,
        balance: b.balance,
        issuer: b.asset_type !== 'native' ? b.asset_issuer : undefined,
      }));

      return {
        accountId: account.accountId(),
        sequence: account.sequenceNumber(),
        balances,
        subentryCount: account.subentry_count,
      };
    } catch {
      return null;
    }
  }
}

export const horizonService = new StellarHorizonService();
