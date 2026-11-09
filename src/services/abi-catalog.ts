export class AbiCatalog {
  public static readonly CONTRACT_METHODS = [
    'initialize',
    'create_agreement',
    'fund_agreement',
    'submit_milestone',
    'approve_milestone',
    'reject_milestone',
    'raise_dispute',
    'resolve_dispute',
    'claim_timeout_refund',
    'cancel_agreement_mutual',
    'reassign_arbiter',
  ];

  public static isRecognizedMethod(methodName: string): boolean {
    return this.CONTRACT_METHODS.includes(methodName);
  }
}
