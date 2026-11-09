export class BatchedTaskQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  constructor(private readonly concurrency: number = 2) {}

  public enqueue(task: () => Promise<void>): void {
    this.queue.push(task);
    this.process();
  }

  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrency);
      await Promise.all(batch.map(t => t().catch(e => console.error('Task error:', e))));
    }

    this.isProcessing = false;
  }

  public pendingCount(): number {
    return this.queue.length;
  }
}
