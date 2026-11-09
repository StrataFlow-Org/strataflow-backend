export interface HealthComponent {
  name: string;
  check: () => Promise<boolean>;
}

export class HealthRegistry {
  private components: HealthComponent[] = [];

  public register(component: HealthComponent): void {
    this.components.push(component);
  }

  public async evaluateAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const comp of this.components) {
      try {
        results[comp.name] = await comp.check();
      } catch {
        results[comp.name] = false;
      }
    }
    return results;
  }
}
