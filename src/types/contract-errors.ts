export enum SorobanContractErrorCode {
  AlreadyInitialized = 1,
  NotInitialized = 2,
  Unauthorized = 3,
  AgreementNotFound = 4,
  MilestoneNotFound = 5,
  InvalidStatus = 6,
  InsufficientFunds = 7,
  ZeroAmount = 8,
  ArithmeticOverflow = 9,
  DisputeAlreadyRaised = 10,
  DisputeNotRaised = 11,
  DeadlinePassed = 12,
  DeadlineNotPassed = 13,
  InvalidMilestones = 14,
  EmergencyPaused = 15,
  InvalidFeeConfig = 16,
  InvalidDisputeSplit = 17,
  MilestoneAlreadySubmitted = 18,
  MilestoneAlreadyApproved = 19,
  StorageLimitExceeded = 20,
}

export const ERROR_CODE_DESCRIPTIONS: Record<SorobanContractErrorCode, string> = {
  [SorobanContractErrorCode.AlreadyInitialized]: 'Smart contract instance has already been initialized.',
  [SorobanContractErrorCode.NotInitialized]: 'Smart contract instance is uninitialized.',
  [SorobanContractErrorCode.Unauthorized]: 'Caller address is unauthorized for this action.',
  [SorobanContractErrorCode.AgreementNotFound]: 'The requested agreement ID was not found in storage.',
  [SorobanContractErrorCode.MilestoneNotFound]: 'The specified milestone index does not exist.',
  [SorobanContractErrorCode.InvalidStatus]: 'Action is not permitted in the current agreement state.',
  [SorobanContractErrorCode.InsufficientFunds]: 'Contract escrow balance is insufficient for requested operation.',
  [SorobanContractErrorCode.ZeroAmount]: 'Escrow amounts and milestone allocations must be strictly greater than zero.',
  [SorobanContractErrorCode.ArithmeticOverflow]: 'Arithmetic overflow occurred during token computation.',
  [SorobanContractErrorCode.DisputeAlreadyRaised]: 'A dispute has already been logged for this agreement.',
  [SorobanContractErrorCode.DisputeNotRaised]: 'Cannot resolve dispute because agreement is not currently disputed.',
  [SorobanContractErrorCode.DeadlinePassed]: 'Action rejected: agreement completion deadline has expired.',
  [SorobanContractErrorCode.DeadlineNotPassed]: 'Timeout refund rejected: agreement deadline has not yet elapsed.',
  [SorobanContractErrorCode.InvalidMilestones]: 'Milestone amounts sum does not match agreement total amount.',
  [SorobanContractErrorCode.EmergencyPaused]: 'Contract is currently in emergency paused state by admin.',
  [SorobanContractErrorCode.InvalidFeeConfig]: 'Fee basis points exceeds protocol maximum ceiling (500 bps / 5%).',
  [SorobanContractErrorCode.InvalidDisputeSplit]: 'Dispute apportionment does not equal total available balance.',
  [SorobanContractErrorCode.MilestoneAlreadySubmitted]: 'Proof has already been submitted for this milestone.',
  [SorobanContractErrorCode.MilestoneAlreadyApproved]: 'Milestone funds have already been released.',
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
