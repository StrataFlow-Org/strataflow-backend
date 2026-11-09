import { rpc } from '@stellar/stellar-sdk';
import { AgreementStatus, MilestoneStatus } from '@prisma/client';
import { config } from '../config.js';
import { SorobanEventDecoder, DecodedEvent } from './event-decoder.js';
import { agreementRepo } from '../repositories/agreement-repo.js';
import { webhookDispatcher } from './webhook-dispatcher.js';

export class SorobanIndexerService {
  private server: rpc.Server;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private lastLedger: number = 0;
  private processedEventIds: Set<string> = new Set();
  private memoryEvents: DecodedEvent[] = [];
  private consecutiveErrors: number = 0;

  constructor() {
    this.server = new rpc.Server(config.SOROBAN_RPC_URL);
  }

  public async start(initialLedger?: number) {
    if (this.isRunning) return;
    this.isRunning = true;

    if (initialLedger) {
      this.lastLedger = initialLedger;
    } else {
      try {
        const latest = await this.server.getLatestLedger();
        this.lastLedger = latest.sequence;
      } catch {
        this.lastLedger = 1;
      }
    }

    console.log(
      `[SorobanIndexer] Listening to events at ${config.SOROBAN_RPC_URL} starting from ledger ${this.lastLedger}`
    );
    this.scheduleNextPoll(1000);
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public getLastLedger(): number {
    return this.lastLedger;
  }

  public calculateBackoff(attempt: number): number {
    const base = 1000;
    const max = 30000;
    const exp = Math.min(max, base * Math.pow(2, attempt));
    const jitter = Math.floor(Math.random() * 500);
    return exp + jitter;
  }

  public async pollEvents(): Promise<DecodedEvent[]> {
    if (!config.STRATAFLOW_CONTRACT_ID || config.STRATAFLOW_CONTRACT_ID.startsWith('CAAAAA')) {
      return [];
    }

    try {
      const response = await this.server.getEvents({
        startLedger: this.lastLedger > 0 ? this.lastLedger : undefined,
        filters: [
          {
            type: 'contract',
            contractIds: [config.STRATAFLOW_CONTRACT_ID],
          },
        ],
        limit: 50,
      });

      const newEvents: DecodedEvent[] = [];

      if (response && response.events) {
        for (const raw of response.events) {
          if (this.processedEventIds.has(raw.id)) continue;

          const decoded = SorobanEventDecoder.decodeRpcEvent({
            id: raw.id,
            contractId: raw.contractId ? raw.contractId.toString() : config.STRATAFLOW_CONTRACT_ID,
            ledger: raw.ledger,
            ledgerClosedAt: raw.ledgerClosedAt,
            topic: raw.topic.map((t) => t.toXDR('base64')),
            value: raw.value.toXDR('base64'),
          });

          this.processedEventIds.add(raw.id);
          this.recordEvent(decoded);
          await this.processDecodedEvent(decoded);
          newEvents.push(decoded);

          if (raw.ledger > this.lastLedger) {
            this.lastLedger = raw.ledger;
          }
        }
      }

      this.consecutiveErrors = 0;
      return newEvents;
    } catch {
      this.consecutiveErrors++;
      return [];
    }
  }

  private scheduleNextPoll(delayMs: number) {
    if (!this.isRunning) return;

    this.timer = setTimeout(async () => {
      await this.pollEvents();
      const nextDelay = this.consecutiveErrors > 0
        ? this.calculateBackoff(this.consecutiveErrors)
        : 4000;
      this.scheduleNextPoll(nextDelay);
    }, delayMs);
  }

  public recordEvent(event: DecodedEvent) {
    this.memoryEvents.unshift(event);
    if (this.memoryEvents.length > 1000) {
      this.memoryEvents.pop();
    }
  }

  public async processDecodedEvent(event: DecodedEvent): Promise<void> {
    try {
      // 1. Record in repository event log
      await agreementRepo.recordEventLog({
        agreementId: event.agreementId,
        type: event.type,
        ledger: event.ledger,
        txHash: event.id,
        payload: event.data,
      });

      // 2. Dispatch to registered webhook subscribers
      webhookDispatcher.queueEvent(event.type, {
        agreementId: event.agreementId,
        ledger: event.ledger,
        txHash: event.id,
        timestamp: event.timestamp,
        ...event.data,
      });

      if (!event.agreementId) return;
      const onChainId = BigInt(event.agreementId);
      const payload = event.data;

      switch (event.type) {
        case 'create':
        case 'AgreementCreated': {
          await this.handleAgreementCreated(onChainId, payload);
          break;
        }

        case 'fund':
        case 'AgreementFunded': {
          await this.handleAgreementFunded(onChainId, payload);
          break;
        }

        case 'submit':
        case 'MilestoneSubmitted': {
          await this.handleMilestoneSubmitted(onChainId, payload);
          break;
        }

        case 'release':
        case 'MilestoneApproved': {
          await this.handleMilestoneApproved(onChainId, payload);
          break;
        }

        case 'dispute':
        case 'DisputeRaised': {
          await this.handleDisputeRaised(onChainId);
          break;
        }

        case 'resolve':
        case 'DisputeResolved': {
          await this.handleDisputeResolved(onChainId);
          break;
        }

        case 'cancel':
        case 'AgreementCancelled': {
          await this.handleAgreementCancelled(onChainId);
          break;
        }

        case 'refund':
        case 'TimeoutRefund': {
          await this.handleTimeoutRefund(onChainId);
          break;
        }

        case 'mut_can':
        case 'MutualCancelled': {
          await this.handleMutualCancelled(onChainId);
          break;
        }

        case 'arb_chg':
        case 'ArbiterReassigned': {
          await this.handleArbiterReassigned(onChainId, payload);
          break;
        }

        case 'disp_to':
        case 'DisputeTimeout': {
          await agreementRepo.updateAgreementStatus(onChainId, AgreementStatus.CANCELLED, '0');
          break;
        }

        case 'verdict':
        case 'DisputeVerdict': {
          break;
        }

        case 'upgrade': {
          const { ContractVersionTrackerService } = await import('./version-tracker.js');
          ContractVersionTrackerService.recordUpgrade(String(payload.payload ?? payload), event.ledger);
          break;
        }

        case 'reject':
        case 'MilestoneRejected': {
          await this.handleMilestoneRejected(onChainId, payload);
          break;
        }
      }
    } catch (err) {
      console.error(`[SorobanIndexer] Error processing event ${event.id}:`, err);
    }
  }

  private async handleAgreementCreated(onChainId: bigint, payload: any): Promise<void> {
    const client = (payload.client || '').toString();
    const provider = (payload.provider || '').toString();
    const arbiter = (payload.arbiter || '').toString();
    const token = (payload.token || '').toString();
    const totalAmount = (payload.totalAmount ?? payload.total_amount ?? payload.amount ?? '0').toString();
    const deadline = payload.deadline
      ? new Date(Number(payload.deadline) * 1000)
      : new Date(Date.now() + 86400000 * 30);

    const milestones = Array.isArray(payload.milestones)
      ? payload.milestones.map((m: any, idx: number) => ({
          index: idx,
          description: m.description || `Milestone #${idx + 1}`,
          amount: (m.amount ?? '0').toString(),
          status: MilestoneStatus.PENDING,
        }))
      : undefined;

    await agreementRepo.upsertAgreement({
      onChainId,
      clientAddress: client,
      providerAddress: provider,
      arbiterAddress: arbiter,
      tokenAddress: token,
      totalAmount,
      balance: '0',
      status: AgreementStatus.CREATED,
      deadline,
      milestones,
    });
  }

  private async handleAgreementFunded(onChainId: bigint, payload: any): Promise<void> {
    const fundedAmount = (payload.amount ?? payload.totalAmount ?? '0').toString();
    await agreementRepo.updateAgreementStatus(onChainId, AgreementStatus.FUNDED, fundedAmount);
  }

  private async handleMilestoneSubmitted(onChainId: bigint, payload: any): Promise<void> {
    const milestoneIndex = typeof payload.milestoneIdx === 'number'
      ? payload.milestoneIdx
      : (typeof payload.milestone_index === 'number' ? payload.milestone_index : 0);
    const proofHash = payload.proofHash
      ? payload.proofHash.toString()
      : (payload.proof_hash ? payload.proof_hash.toString() : undefined);
    await agreementRepo.updateMilestoneStatus(
      onChainId,
      milestoneIndex,
      MilestoneStatus.SUBMITTED,
      proofHash
    );
  }

  private async handleMilestoneApproved(onChainId: bigint, payload: any): Promise<void> {
    const milestoneIndex = typeof payload.milestoneIdx === 'number'
      ? payload.milestoneIdx
      : (typeof payload.milestone_index === 'number' ? payload.milestone_index : 0);
    await agreementRepo.updateMilestoneStatus(
      onChainId,
      milestoneIndex,
      MilestoneStatus.APPROVED
    );

    const remVal = payload.remainingBalance !== undefined ? payload.remainingBalance : payload.remaining_balance;
    if (remVal !== undefined) {
      const rem = remVal.toString();
      const newStatus = rem === '0' ? AgreementStatus.COMPLETED : AgreementStatus.FUNDED;
      await agreementRepo.updateAgreementStatus(onChainId, newStatus, rem);
    }
  }

  private async handleDisputeRaised(onChainId: bigint): Promise<void> {
    await agreementRepo.updateAgreementStatus(onChainId, AgreementStatus.DISPUTED);
  }

  private async handleDisputeResolved(onChainId: bigint): Promise<void> {
    await agreementRepo.updateAgreementStatus(onChainId, AgreementStatus.RESOLVED, '0');
  }

  private async handleAgreementCancelled(onChainId: bigint): Promise<void> {
    await agreementRepo.updateAgreementStatus(onChainId, AgreementStatus.CANCELLED, '0');
  }

  private async handleTimeoutRefund(onChainId: bigint): Promise<void> {
    await agreementRepo.updateAgreementStatus(onChainId, AgreementStatus.CANCELLED, '0');
  }

  private async handleMutualCancelled(onChainId: bigint): Promise<void> {
    await agreementRepo.updateAgreementStatus(onChainId, AgreementStatus.CANCELLED, '0');
  }

  private async handleArbiterReassigned(onChainId: bigint, payload: any): Promise<void> {
    const newArbiter = String(payload.newArbiter ?? '');
    if (newArbiter) {
      await agreementRepo.updateAgreementArbiter(onChainId, newArbiter);
    }
  }

  private async handleMilestoneRejected(onChainId: bigint, payload: any): Promise<void> {
    const milestoneIdx = Number(payload.milestoneIdx ?? 0);
    const feedbackHash = String(payload.feedbackHash ?? '');
    await agreementRepo.updateMilestoneRejection(onChainId, milestoneIdx, feedbackHash);
  }

  public getEvents(agreementId?: string, type?: string, limit: number = 50): DecodedEvent[] {
    let result = this.memoryEvents;

    if (agreementId) {
      result = result.filter((e) => e.agreementId === agreementId);
    }

    if (type) {
      result = result.filter((e) => e.type === type);
    }

    return result.slice(0, limit);
  }
}

export const indexerService = new SorobanIndexerService();
