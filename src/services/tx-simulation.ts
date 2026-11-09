import { rpc, TransactionBuilder } from '@stellar/stellar-sdk';
import { ProtocolAddressRegistry, NetworkProtocolConfig } from '../config/protocol-addresses.js';

export interface PreflightSimulationResult {
  isSuccess: boolean;
  minResourceFee: string;
  error?: string;
}

export class TransactionSimulationService {
  private server: rpc.Server;
  private config: NetworkProtocolConfig;

  constructor(network?: string) {
    this.config = ProtocolAddressRegistry.getActiveConfig(network);
    this.server = new rpc.Server(this.config.rpcUrl, {
      allowHttp: this.config.rpcUrl.startsWith('http://'),
    });
  }

  public async simulateTransactionXdr(txXdr: string): Promise<PreflightSimulationResult> {
    try {
      const tx = TransactionBuilder.fromXDR(txXdr, this.config.networkPassphrase);
      const sim = await this.server.simulateTransaction(tx);

      if (rpc.Api.isSimulationSuccess(sim)) {
        return {
          isSuccess: true,
          minResourceFee: sim.minResourceFee || '100',
        };
      } else {
        return {
          isSuccess: false,
          minResourceFee: '0',
          error: sim.error || 'Transaction simulation failed on-chain',
        };
      }
    } catch (err: any) {
      return {
        isSuccess: false,
        minResourceFee: '0',
        error: err.message || 'Malformed transaction XDR envelope',
      };
    }
  }
}

export const simulationService = new TransactionSimulationService();

export function estimateMaxResourceFee(minResourceFee: string, safetyMarginMultiplier = 1.25): string {
  try {
    const minFee = BigInt(minResourceFee);
    const withMargin = (minFee * BigInt(Math.round(safetyMarginMultiplier * 100))) / 100n;
    return withMargin.toString();
  } catch {
    return minResourceFee;
  }
}
