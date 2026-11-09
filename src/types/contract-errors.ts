export enum SorobanContractErrorCode {
  AlreadyInitialized = 1,
  NotInitialized = 2,
  Unauthorized = 3,
  AgreementNotFound = 4,
  InvalidMilestone = 5,
  InvalidStatus = 6,
  MilestoneNotCompleted = 7,
  DisputeAlreadyActive = 8,
  DisputeNotActive = 9,
  DeadlinePassed = 10,
  InvalidSplit = 11,
  MilestoneLimitExceeded = 12,
  ProtocolPaused = 13,
  MilestoneOutOfOrder = 14,
  DeadlineNotPassed = 15,
  CannotCancelFunded = 16,
  InvalidFeeBps = 17,
  InsufficientFunds = 18,
  ZeroAmount = 19,
  StorageLimitExceeded = 20,
}

export const ERROR_CODE_DESCRIPTIONS: Record<SorobanContractErrorCode, string> = {
  [SorobanContractErrorCode.AlreadyInitialized]: 'Smart contract instance has already been initialized.',
  [SorobanContractErrorCode.NotInitialized]: 'Smart contract instance is uninitialized.',
  [SorobanContractErrorCode.Unauthorized]: 'Caller address is unauthorized for this action.',
  [SorobanContractErrorCode.AgreementNotFound]: 'The requested agreement ID was not found in storage.',
  [SorobanContractErrorCode.InvalidMilestone]: 'The specified milestone configuration or index is invalid.',
  [SorobanContractErrorCode.InvalidStatus]: 'Action is not permitted in the current agreement status.',
  [SorobanContractErrorCode.MilestoneNotCompleted]: 'Milestone has not yet been submitted or approved.',
  [SorobanContractErrorCode.DisputeAlreadyActive]: 'A dispute is already active on this agreement.',
  [SorobanContractErrorCode.DisputeNotActive]: 'Cannot resolve dispute because agreement is not currently disputed.',
  [SorobanContractErrorCode.DeadlinePassed]: 'Action rejected: agreement completion deadline has expired.',
  [SorobanContractErrorCode.InvalidSplit]: 'Dispute apportionment does not equal total available balance.',
  [SorobanContractErrorCode.MilestoneLimitExceeded]: 'Milestone count exceeds maximum allowed limit (25).',
  [SorobanContractErrorCode.ProtocolPaused]: 'Contract is currently in emergency paused state by admin circuit breaker.',
  [SorobanContractErrorCode.MilestoneOutOfOrder]: 'Milestones must be submitted sequentially in order.',
  [SorobanContractErrorCode.DeadlineNotPassed]: 'Timeout refund rejected: agreement deadline has not yet elapsed.',
  [SorobanContractErrorCode.CannotCancelFunded]: 'Cannot cancel an agreement that has already been funded.',
  [SorobanContractErrorCode.InvalidFeeBps]: 'Fee basis points exceeds protocol maximum ceiling (1000 bps / 10%).',
  [SorobanContractErrorCode.InsufficientFunds]: 'Contract escrow balance is insufficient for requested operation.',
  [SorobanContractErrorCode.ZeroAmount]: 'Escrow amounts and milestone allocations must be strictly greater than zero.',
  [SorobanContractErrorCode.StorageLimitExceeded]: 'Storage limit exceeded for agreement milestone vectors.',
};

export class SorobanErrorTranslator {
  public static getErrorMessage(code: number): string {
    const desc = ERROR_CODE_DESCRIPTIONS[code as SorobanContractErrorCode];
    return desc || `Soroban Contract Error #${code}`;
  }

  public static parseError(raw: unknown): { code?: number; message: string } {
    if (!raw) return { message: 'Unknown contract execution error' };

    const str = typeof raw === 'string' ? raw : raw instanceof Error ? raw.message : JSON.stringify(raw);

    // Look for Soroban error pattern "Error(Contract, #XX)"
    const match = str.match(/Error\(Contract,\s*#?(\d+)\)/);
    if (match) {
      const code = parseInt(match[1], 10);
      return {
        code,
        message: this.getErrorMessage(code),
      };
    }

    return { message: str };
  }
}

