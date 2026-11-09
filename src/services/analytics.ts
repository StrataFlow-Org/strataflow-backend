import { agreementRepo } from '../repositories/agreement-repo.js';

export interface ExtendedAnalytics {
  totalAgreements: number;
  totalVolume: string;
  activeEscrows: number;
  completedAgreements: number;
  disputedAgreements: number;
  completionRatePercent: number;
  disputeRatePercent: number;
  averageMilestonesPerAgreement: number;
}

export class ProtocolAnalyticsService {
  public static async getExtendedAnalytics(): Promise<ExtendedAnalytics> {
    const stats = await agreementRepo.getStats();
    const total = stats.totalAgreements;

    const completionRatePercent = total > 0
      ? Number(((stats.completedAgreements / total) * 100).toFixed(2))
      : 0;

    const disputeRatePercent = total > 0
      ? Number(((stats.disputedAgreements / total) * 100).toFixed(2))
      : 0;

    const averageMilestonesPerAgreement = total > 0
      ? Number((stats.totalMilestones / total).toFixed(1))
      : 0;

    return {
      ...stats,
      completionRatePercent,
      disputeRatePercent,
      averageMilestonesPerAgreement,
    };
  }
}

export function calculateEscrowVelocity(volume: string, activeCount: number): string {
  if (activeCount <= 0) return '0';
  const volBig = BigInt(volume);
  return (volBig / BigInt(activeCount)).toString();
}
