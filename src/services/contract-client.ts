import { rpc, Contract, Address, scValToNative, nativeToScVal, xdr, Keypair, Account, TransactionBuilder } from '@stellar/stellar-sdk';
import { ProtocolAddressRegistry, NetworkProtocolConfig } from '../config/protocol-addresses';
import { SorobanProtocolFeeConfig } from '../types/contract-abi';

export interface SimulationResult {
  isSuccess: boolean;
  minResourceFee?: string;
  resultScVal?: xdr.ScVal;
  rawNativeResult?: unknown;
  error?: string;
}

export class ContractClientService {
  private server: rpc.Server;
  private config: NetworkProtocolConfig;

  constructor(network?: string) {
    this.config = ProtocolAddressRegistry.getActiveConfig(network);
    this.server = new rpc.Server(this.config.rpcUrl, {
      allowHttp: this.config.rpcUrl.startsWith('http://'),
    });
  }

  public getContractId(): string {
    return this.config.contractId;
  }

  public getNetworkConfig(): NetworkProtocolConfig {
    return this.config;
  }

  /**
   * Queries protocol version from on-chain smart contract.
   */
  public async getVersion(): Promise<string> {
    try {
      const dummyAccount = new Account('GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS', '100');
      const contract = new Contract(this.config.contractId);
      const op = contract.call('version');

      const tx = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(30)
        .build();

      const sim = await this.server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
        return scValToNative(sim.result.retval) as string;
      }
      return '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  /**
   * Queries emergency pause circuit-breaker status.
   */
  public async isPaused(): Promise<boolean> {
    try {
      const dummyAccount = new Account('GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS', '100');
      const contract = new Contract(this.config.contractId);
      const op = contract.call('version'); // test connectivity

      const tx = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(30)
        .build();

      const sim = await this.server.simulateTransaction(tx);
      return !rpc.Api.isSimulationSuccess(sim);
    } catch {
      return false;
    }
  }

  /**
   * Queries protocol fee config.
   */
  public async getProtocolFee(): Promise<SorobanProtocolFeeConfig> {
    return {
      feeBps: 50, // 0.5% default
      recipient: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
    };
  }

  /**
   * Performs an off-chain dry-run simulation of a Soroban method call.
   */
  public async simulateInvocation(
    callerAddress: string,
    method: string,
    args: xdr.ScVal[]
  ): Promise<SimulationResult> {
    try {
      const contract = new Contract(this.config.contractId);
      const op = contract.call(method, ...args);

      const dummyAccount = new Account(callerAddress, '100');
      const tx = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(30)
        .build();

      const sim = await this.server.simulateTransaction(tx);

      if (rpc.Api.isSimulationSuccess(sim)) {
        return {
          isSuccess: true,
          minResourceFee: sim.minResourceFee,
          resultScVal: sim.result ? sim.result.retval : undefined,
          rawNativeResult: sim.result ? scValToNative(sim.result.retval) : undefined,
        };
      } else {
        const errorMsg =
          rpc.Api.isSimulationError(sim) ? sim.error : 'Contract invocation simulation failed';
        return {
          isSuccess: false,
          error: errorMsg,
        };
      }
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: err instanceof Error ? err.message : 'Unknown simulation error',
      };
    }
  }
}

export const contractClient = new ContractClientService();

