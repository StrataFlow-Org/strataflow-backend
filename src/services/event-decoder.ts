import { scValToNative, xdr } from '@stellar/stellar-sdk';

export interface DecodedEvent {
  id: string;
  contractId: string;
  ledger: number;
  timestamp: string;
  type: string;
  agreementId: string;
  topicDetails: unknown[];
  data: Record<string, unknown>;
}

export class SorobanEventDecoder {
  /**
   * Safely decodes base64 ScVal XDR string into native JS values
   */
  public static decodeScVal(base64Xdr: string): unknown {
    try {
      const parsedScVal = xdr.ScVal.fromXDR(base64Xdr, 'base64');
      const native = scValToNative(parsedScVal);
      // Convert BigInt to string for JSON serialization safety
      return this.serializeBigInts(native);
    } catch {
      return base64Xdr;
    }
  }

  private static serializeBigInts(val: unknown): unknown {
    if (typeof val === 'bigint') {
      return val.toString();
    }
    if (Array.isArray(val)) {
      return val.map((item) => this.serializeBigInts(item));
    }
    if (val !== null && typeof val === 'object') {
      const res: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val)) {
        res[k] = this.serializeBigInts(v);
      }
      return res;
    }
    return val;
  }

  /**
   * Parses raw Soroban RPC event into strongly-typed DecodedEvent
   */
  public static decodeRpcEvent(rawEvent: {
    id: string;
    contractId: string;
    ledger: number;
    ledgerClosedAt: string;
    topic: string[];
    value: string;
  }): DecodedEvent {
    const decodedTopics = rawEvent.topic.map((t) => this.decodeScVal(t));
    const decodedValue = this.decodeScVal(rawEvent.value);

    const eventType = String(decodedTopics[0] || 'unknown');
    const agreementId = decodedTopics.length > 1 ? String(decodedTopics[1]) : '0';

    const data: Record<string, unknown> = {};

    switch (eventType) {
      case 'create':
        if (Array.isArray(decodedValue)) {
          data.client = decodedValue[0];
          data.provider = decodedValue[1];
          data.totalAmount = decodedValue[2];
        }
        break;

      case 'fund':
        if (Array.isArray(decodedValue)) {
          data.funder = decodedValue[0];
          data.amount = decodedValue[1];
        }
        break;

      case 'submit':
        data.milestoneIdx = Number(decodedTopics[2] ?? 0);
        data.proofHash = decodedValue;
        break;

      case 'release':
        data.milestoneIdx = Number(decodedTopics[2] ?? 0);
        data.remainingBalance = decodedValue;
        break;

      case 'dispute':
        data.milestoneIdx = Number(decodedTopics[2] ?? 0);
        data.caller = decodedValue;
        break;

      case 'resolve':
        if (Array.isArray(decodedValue)) {
          data.clientAmount = decodedValue[0];
          data.providerAmount = decodedValue[1];
        }
        break;

      case 'refund':
        data.client = decodedValue;
        break;

      case 'cancel':
        data.client = decodedValue;
        break;

      case 'reject':
        data.milestoneIdx = Number(decodedTopics[2] ?? 0);
        data.feedbackHash = decodedValue;
        break;

      case 'mut_can':
        if (Array.isArray(decodedValue)) {
          data.client = decodedValue[0];
          data.refundAmount = decodedValue[1];
        }
        break;

      case 'fee_paid':
        data.milestoneIdx = decodedTopics[2];
        if (Array.isArray(decodedValue)) {
          data.recipient = decodedValue[0];
          data.feeAmount = decodedValue[1];
        }
        break;

      default:
        data.payload = decodedValue;
    }

    return {
      id: rawEvent.id,
      contractId: rawEvent.contractId,
      ledger: rawEvent.ledger,
      timestamp: rawEvent.ledgerClosedAt || new Date().toISOString(),
      type: eventType,
      agreementId,
      topicDetails: decodedTopics,
      data,
    };
  }
}
