export interface ParsedSorobanError {
  isSorobanError: boolean;
  errorCode?: number;
  description: string;
}

export class SorobanErrorParser {
  private static readonly CODE_MAP: Record<number, string> = {
    1: 'Protocol already initialized',
    2: 'Protocol not initialized',
    3: 'Caller unauthorized for action',
    4: 'Agreement does not exist',
    5: 'Invalid milestone index',
    6: 'Agreement status not valid for operation',
    10: 'Agreement deadline passed',
    11: 'Dispute split does not match escrow balance',
    13: 'Protocol contract operations paused',
    15: 'Deadline has not passed yet',
    16: 'Cannot cancel funded agreement without mutual approval',
    24: 'Agreement duration is shorter than minimum allowed (1 hour)',
  };

  public static parse(errorMessage: string): ParsedSorobanError {
    const match = errorMessage.match(/Error\(Contract,\s*#?([0-9]+)\)/i);
    if (!match) {
      return { isSorobanError: false, description: errorMessage };
    }
    const code = parseInt(match[1], 10);
    return {
      isSorobanError: true,
      errorCode: code,
      description: this.CODE_MAP[code] || `Soroban Contract Error #${code}`,
    };
  }
}
