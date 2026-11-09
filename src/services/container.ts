export class ServiceContainer {
  private services: Map<string, any> = new Map();

  public register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  public get<T>(name: string): T {
    const s = this.services.get(name);
    if (!s) throw new Error(`Service '${name}' not found in container`);
    return s as T;
  }

  public has(name: string): boolean {
    return this.services.has(name);
  }
}
