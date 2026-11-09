export class CursorManager {
  private cursors: Map<string, string> = new Map();

  public saveCursor(topic: string, cursor: string): void {
    this.cursors.set(topic, cursor);
  }

  public getCursor(topic: string, fallback: string = 'now'): string {
    return this.cursors.get(topic) || fallback;
  }

  public resetCursor(topic: string): void {
    this.cursors.delete(topic);
  }
}
