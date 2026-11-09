export type ProtocolEventType =
  | 'AgreementCreated'
  | 'AgreementFunded'
  | 'MilestoneSubmitted'
  | 'MilestoneApproved'
  | 'DisputeRaised'
  | 'DisputeResolved'
  | 'TimeoutRefundClaimed'
  | 'AgreementCancelled'
  | 'AdminNominated'
  | 'MilestoneRejected'
  | 'MutualCancelled';

export interface AgreementCreatedEvent {
  type: 'AgreementCreated';
  agreementId: bigint;
  client: string;
  provider: string;
  totalAmount: bigint;
  deadline: number;
  ledger: number;
  txHash: string;
}

export interface AgreementFundedEvent {
  type: 'AgreementFunded';
  agreementId: bigint;
  caller: string;
  amount: bigint;
  ledger: number;
  txHash: string;
}

export interface MilestoneSubmittedEvent {
  type: 'MilestoneSubmitted';
  agreementId: bigint;
  milestoneIndex: number;
  proofHash: string;
  ledger: number;
  txHash: string;
}

export interface MilestoneApprovedEvent {
  type: 'MilestoneApproved';
  agreementId: bigint;
  milestoneIndex: number;
  amount: bigint;
  feeDeducted: bigint;
  ledger: number;
  txHash: string;
}

export interface DisputeRaisedEvent {
  type: 'DisputeRaised';
  agreementId: bigint;
  caller: string;
  reason: string;
  ledger: number;
  txHash: string;
}

export interface DisputeResolvedEvent {
  type: 'DisputeResolved';
  agreementId: bigint;
  arbiter: string;
  clientAmount: bigint;
  providerAmount: bigint;
  ledger: number;
  txHash: string;
}

export interface TimeoutRefundClaimedEvent {
  type: 'TimeoutRefundClaimed';
  agreementId: bigint;
  client: string;
  refundAmount: bigint;
  ledger: number;
  txHash: string;
}

export interface AgreementCancelledEvent {
  type: 'AgreementCancelled';
  agreementId: bigint;
  caller: string;
  ledger: number;
  txHash: string;
}

export type ProtocolEventPayload =
  | AgreementCreatedEvent
  | AgreementFundedEvent
  | MilestoneSubmittedEvent
  | MilestoneApprovedEvent
  | DisputeRaisedEvent
  | DisputeResolvedEvent
  | TimeoutRefundClaimedEvent
  | AgreementCancelledEvent;


export interface AdminNominatedEvent {
  type: 'AdminNominated';
  currentAdmin: string;
  pendingAdmin: string;
  ledger: number;
  txHash: string;
}

export interface MilestoneRejectedEvent {
  type: 'MilestoneRejected';
  agreementId: bigint;
  milestoneIndex: number;
  feedbackHash: string;
  ledger: number;
  txHash: string;
}

export interface MutualCancelledEvent {
  type: 'MutualCancelled';
  agreementId: bigint;
  client: string;
  refundAmount: bigint;
  ledger: number;
  txHash: string;
}
