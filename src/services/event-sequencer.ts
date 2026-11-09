export interface SequencedEvent {
  ledgerSequence: number;
  txHash: string;
  eventId: string;
  timestamp: number;
}

export class EventSequencer {
  public static sortEvents<T extends SequencedEvent>(events: T[]): T[] {
    return [...events].sort((a, b) => {
      if (a.ledgerSequence !== b.ledgerSequence) {
        return a.ledgerSequence - b.ledgerSequence;
      }
      return a.eventId.localeCompare(b.eventId);
    });
  }

  public static deduplicate<T extends SequencedEvent>(events: T[]): T[] {
    const seen = new Set<string>();
    const unique: T[] = [];
    for (const ev of events) {
      const key = `${ev.txHash}_${ev.eventId}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(ev);
      }
    }
    return unique;
  }
}
