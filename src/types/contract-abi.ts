/**
 * StrataFlow Protocol Soroban Smart Contract ABI Definitions.
 * Mirrors the exact Rust function signatures in StrataFlow-Org/strataflow-contracts.
 */

export interface SorobanMilestoneInput {
  description: string;
  amount: bigint;
}

export interface SorobanCreateAgreementParams {
  client: string;
  provider: string;
  arbiter: string;
  token: string;
  totalAmount: bigint;
  deadline: number;
  milestoneDescriptions: string[];
  milestoneAmounts: bigint[];
}

export interface SorobanProtocolFeeConfig {
  feeBps: number; // basis points, e.g. 50 = 0.5%
  recipient: string;
}

export type SorobanAgreementStatus =
  | 'CREATED'
  | 'FUNDED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'RESOLVED'
  | 'CANCELLED';

export type SorobanMilestoneStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'DISPUTED';

export interface StrataFlowContractAbi {
  // Protocol Administration
  initialize(admin: string, feeBps: number, feeRecipient: string): Promise<void>;
  version(): Promise<string>;
  pause(admin: string): Promise<void>;
  unpause(admin: string): Promise<void>;
  set_protocol_fee(admin: string, feeBps: number, feeRecipient: string): Promise<void>;
  get_protocol_fee(): Promise<SorobanProtocolFeeConfig>;

  // Agreement Lifecycle
  create_agreement(params: SorobanCreateAgreementParams): Promise<bigint>;
  fund_agreement(caller: string, agreementId: bigint, amount: bigint): Promise<void>;
  submit_milestone(provider: string, agreementId: bigint, milestoneIndex: number, proofHash: string): Promise<void>;
  release_milestone(client: string, agreementId: bigint, milestoneIndex: number): Promise<void>;
  raise_dispute(caller: string, agreementId: bigint, reason: string): Promise<void>;
  resolve_dispute(arbiter: string, agreementId: bigint, clientAmount: bigint, providerAmount: bigint): Promise<void>;
  claim_timeout_refund(client: string, agreementId: bigint): Promise<void>;
  cancel_agreement(caller: string, agreementId: bigint): Promise<void>;
}

