export class RedirectGuard {
  private allowedHostnames: Set<string>;

  constructor(allowedHosts: string[] = ['localhost', '127.0.0.1', 'strataflow.org']) {
    this.allowedHostnames = new Set(allowedHosts);
  }

  public isSafeRedirectUrl(targetUrl: string): boolean {
    try {
      const parsed = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      return this.allowedHostnames.has(parsed.hostname);
    } catch {
      return false;
    }
  }
}
