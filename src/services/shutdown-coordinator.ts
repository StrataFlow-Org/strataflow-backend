export class ShutdownCoordinator {
  private shutdownHandlers: Array<() => Promise<void>> = [];
  private isShuttingDown: boolean = false;

  public registerHandler(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    for (const handler of this.shutdownHandlers.reverse()) {
      try {
        await handler();
      } catch (err) {
        console.error('Error during shutdown handler execution:', err);
      }
    }
  }

  public getStatus(): boolean {
    return this.isShuttingDown;
  }
}
