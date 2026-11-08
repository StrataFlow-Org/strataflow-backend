import { rpc } from '@stellar/stellar-sdk';
import { config } from '../config.js';
import { SorobanEventDecoder, DecodedEvent } from './event-decoder.js';

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
          newEvents.push(decoded);

          if (raw.ledger > this.lastLedger) {
            this.lastLedger = raw.ledger;
          }
        }
      }

      this.consecutiveErrors = 0;
      return newEvents;
    } catch (err: unknown) {
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
