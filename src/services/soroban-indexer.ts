import { rpc } from '@stellar/stellar-sdk';
import { config } from '../config.js';

export interface IndexedEvent {
  id: string;
  type: 'create' | 'fund' | 'submit' | 'release' | 'dispute' | 'resolve';
  agreementId: string;
  ledger: number;
  timestamp: string;
  data: Record<string, unknown>;
}

export class SorobanIndexerService {
  private server: rpc.Server;
  private isRunning: boolean = false;
  private memoryEvents: IndexedEvent[] = [];

  constructor() {
    this.server = new rpc.Server(config.SOROBAN_RPC_URL);
  }

  public async start() {
    this.isRunning = true;
    console.log(`[SorobanIndexer] Listening to events at ${config.SOROBAN_RPC_URL}`);
  }

  public stop() {
    this.isRunning = false;
  }

  public getEvents(agreementId?: string): IndexedEvent[] {
    if (agreementId) {
      return this.memoryEvents.filter((e) => e.agreementId === agreementId);
    }
    return this.memoryEvents;
  }

  public recordEvent(event: IndexedEvent) {
    this.memoryEvents.unshift(event);
    if (this.memoryEvents.length > 500) {
      this.memoryEvents.pop();
    }
  }
}

export const indexerService = new SorobanIndexerService();

