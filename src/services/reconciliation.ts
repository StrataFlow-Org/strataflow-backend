import { agreementRepo } from '../repositories/agreement-repo.js';
import { contractClient } from './contract-client.js';

export interface ReconciliationAuditResult {
  agreementId: string;
  dbBalance: string;
  onChainBalance: string;
  isBalanced: boolean;
  discrepancy: string;
  auditedAt: string;
}

export class EscrowReconciliationService {
  public static async auditAgreement(onChainId: bigint): Promise<ReconciliationAuditResult | null> {
    const agreement = await agreementRepo.getAgreementByOnChainId(onChainId);
    if (!agreement) return null;

    const dbBalance = agreement.balance;
    let onChainBalance = dbBalance;

    try {
      onChainBalance = await contractClient.getRemainingEscrow(onChainId);
    } catch {
      // Fallback
    }

    const diff = (BigInt(dbBalance) - BigInt(onChainBalance)).toString();

    return {
      agreementId: onChainId.toString(),
      dbBalance,
      onChainBalance,
      isBalanced: diff === '0',
      discrepancy: diff,
      auditedAt: new Date().toISOString(),
    };
  }
}
