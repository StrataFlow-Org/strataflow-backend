import { contractClient } from './contract-client.js';
import { agreementRepo } from '../repositories/agreement-repo.js';

export interface DisputeTelemetry {
  agreementId: string;
  isDisputed: boolean;
  arbiterAddress: string;
  remainingSeconds: number;
  remainingDays: number;
  canTimeoutResolve: boolean;
}

export class DisputeTelemetryService {
  public static async getDisputeStatus(agreementId: bigint): Promise<DisputeTelemetry | null> {
    const agreement = await agreementRepo.getAgreementByOnChainId(agreementId);
    if (!agreement) return null;

    const remainingSeconds = await contractClient.getDisputeWindowRemaining(agreementId);
    const isDisputed = agreement.status === 'DISPUTED';

    return {
      agreementId: agreementId.toString(),
      isDisputed,
      arbiterAddress: agreement.arbiterAddress,
      remainingSeconds,
      remainingDays: Math.floor(remainingSeconds / 86400),
      canTimeoutResolve: isDisputed && remainingSeconds === 0,
    };
  }
}
