export type AgreementState = 'CREATED' | 'FUNDED' | 'COMPLETED' | 'DISPUTED' | 'RESOLVED' | 'CANCELLED';

export class AgreementStateMachine {
  private static readonly VALID_TRANSITIONS: Record<AgreementState, AgreementState[]> = {
    CREATED: ['FUNDED', 'CANCELLED'],
    FUNDED: ['COMPLETED', 'DISPUTED', 'CANCELLED'],
    DISPUTED: ['RESOLVED', 'COMPLETED'],
    COMPLETED: [],
    RESOLVED: [],
    CANCELLED: [],
  };

  public static canTransition(from: AgreementState, to: AgreementState): boolean {
    const allowed = this.VALID_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }
}
