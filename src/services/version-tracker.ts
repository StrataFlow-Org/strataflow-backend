export interface UpgradeHistoryRecord {
  wasmHash: string;
  installedAt: string;
  installedByLedger: number;
}

export class ContractVersionTrackerService {
  private static history: UpgradeHistoryRecord[] = [
    {
      wasmHash: 'INITIAL_WASM_V1_STRATAFLOW_TESTNET_2026',
      installedAt: '2026-11-09T08:00:00Z',
      installedByLedger: 100000,
    },
  ];

  public static recordUpgrade(wasmHash: string, ledger: number): void {
    this.history.unshift({
      wasmHash,
      installedAt: new Date().toISOString(),
      installedByLedger: ledger,
    });
  }

  public static getUpgradeHistory(): UpgradeHistoryRecord[] {
    return this.history;
  }
}
