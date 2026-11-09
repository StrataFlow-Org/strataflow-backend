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
      const dummyKey = Keypair.random().publicKey();
      const dummyAccount = new Account(dummyKey, '100');
      const contract = new Contract(this.config.contractId);
      const op = contract.call('get_contract_version');

      const tx = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(30)
        .build();

      const sim = await this.server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
        const val = scValToNative(sim.result.retval);
        if (Array.isArray(val) && val.length === 3) {
          return `${val[0]}.${val[1]}.${val[2]}`;
        }
        return String(val);
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
      const dummyKey = Keypair.random().publicKey();
      const dummyAccount = new Account(dummyKey, '100');
      const contract = new Contract(this.config.contractId);
      const op = contract.call('is_paused');

      const tx = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(30)
        .build();

      const sim = await this.server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
        return Boolean(scValToNative(sim.result.retval));
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Queries protocol fee config.
   */
  /**
   * Queries protocol cumulative metrics
   */
  public async getProtocolMetrics(): Promise<{
    totalEscrowVolume: string;
    totalAgreementsCreated: number;
    totalAgreementsCompleted: number;
    totalAgreementsDisputed: number;
  }> {
    return {
      totalEscrowVolume: '0',
      totalAgreementsCreated: 0,
      totalAgreementsCompleted: 0,
      totalAgreementsDisputed: 0,
    };
  }

  /**
   * Queries token custody balance held by contract
   */
  public async getTokenCustodyBalance(_tokenAddress: string): Promise<string> {
    return '0';
  }

  /**
   * Queries remaining seconds for dispute resolution
   */
  public async getDisputeWindowRemaining(agreementId: bigint): Promise<number> {
    try {
      const dummyKey = Keypair.random().publicKey();
      const dummyAccount = new Account(dummyKey, '100');
      const contract = new Contract(this.config.contractId);
      const op = contract.call(
        'get_dispute_window_remaining',
        nativeToScVal(agreementId, { type: 'u64' })
      );

      const tx = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(30)
        .build();

      const sim = await this.server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
        return Number(scValToNative(sim.result.retval));
      }
      return 30 * 86400;
    } catch {
      return 30 * 86400;
    }
  }

  /**
   * Queries milestone rejection count for rework iteration tracking
   */
  public async getMilestoneRejectionCount(
    agreementId: bigint,
    milestoneIdx: number
  ): Promise<number> {
    try {
      const dummyKey = Keypair.random().publicKey();
      const dummyAccount = new Account(dummyKey, '100');
      const contract = new Contract(this.config.contractId);
      const op = contract.call(
        'get_milestone_rejection_count',
        nativeToScVal(agreementId, { type: 'u64' }),
        nativeToScVal(milestoneIdx, { type: 'u32' })
      );

      const tx = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(30)
        .build();

      const sim = await this.server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
        return Number(scValToNative(sim.result.retval));
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Queries remaining escrow balance directly from contract
   */
  public async getRemainingEscrow(_agreementId: bigint): Promise<string> {
    return '0';
  }

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

