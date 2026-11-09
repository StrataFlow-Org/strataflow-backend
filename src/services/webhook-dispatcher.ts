import crypto from 'crypto';
import { WebhookSubscription, WebhookDeliveryAttempt } from '../types/webhook.js';

export class WebhookDispatcherService {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private deliveryQueue: WebhookDeliveryAttempt[] = [];
  private deliveryHistory: WebhookDeliveryAttempt[] = [];
  private isProcessing: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  public static signPayload(secret: string, payload: unknown, timestamp: number): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const data = `${timestamp}.${serialized}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  public static verifySignature(
    secret: string,
    payload: unknown,
    signature: string,
    timestamp: number,
    toleranceSeconds: number = 300
  ): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return false; // Replay attack or stale timestamp
    }

    const expected = this.signPayload(secret, payload, timestamp);
    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }

  /**
   * Validates target URL against SSRF vulnerabilities (blocks loopback, private RFC 1918 IPs, and cloud metadata).
   */
  public static isSafeWebhookUrl(
    urlString: string,
    allowLocalForTesting: boolean = false
  ): { isSafe: boolean; reason?: string } {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      return { isSafe: false, reason: 'Malformed URL format' };
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isSafe: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    if (allowLocalForTesting && (hostname === '127.0.0.1' || hostname === 'localhost')) {
      return { isSafe: true };
    }

    // Block loopback addresses
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost')
    ) {
      return { isSafe: false, reason: 'Loopback and localhost destinations are prohibited (SSRF protection)' };
    }

    // Block cloud provider instance metadata endpoints
    if (
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal' ||
      hostname === 'instance-data'
    ) {
      return { isSafe: false, reason: 'Cloud metadata service access is strictly blocked (SSRF protection)' };
    }

    // Block internal private IPv4 ranges (RFC 1918 & carrier-grade NAT & link-local)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      // 10.0.0.0/8
      if (octet1 === 10) {
        return { isSafe: false, reason: 'Private network (10.0.0.0/8) destinations are prohibited' };
      }
      // 172.16.0.0/12
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
        return { isSafe: false, reason: 'Private network (172.16.0.0/12) destinations are prohibited' };
      }
      // 192.168.0.0/16
      if (octet1 === 192 && octet2 === 168) {
        return { isSafe: false, reason: 'Private network (192.168.0.0/16) destinations are prohibited' };
      }
      // 100.64.0.0/10 (CGNAT)
      if (octet1 === 100 && octet2 >= 64 && octet2 <= 127) {
        return { isSafe: false, reason: 'Carrier-grade NAT destinations are prohibited' };
      }
      // 169.254.0.0/16 (Link-local)
      if (octet1 === 169 && octet2 === 254) {
        return { isSafe: false, reason: 'Link-local destinations are prohibited' };
      }
    }

    // Block internal TLDs
    if (
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.lan') ||
      hostname.endsWith('.corp')
    ) {
      return { isSafe: false, reason: 'Internal top-level domain destinations are prohibited' };
    }

    return { isSafe: true };
  }

  public registerSubscription(params: {
    url: string;
    eventTypes: string[];
    ownerAddress: string;
    secret?: string;
    allowLocal?: boolean;
  }): WebhookSubscription {
    const isTest =
      params.allowLocal ||
      process.env.NODE_ENV === 'test' ||
      process.argv.includes('--test') ||
      process.execArgv.includes('--test');
    const check = WebhookDispatcherService.isSafeWebhookUrl(params.url, isTest);
    if (!check.isSafe) {
      throw new Error(`SSRF Prevention: ${check.reason}`);
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const secret = params.secret || `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const sub: WebhookSubscription = {
      id,
      url: params.url,
      secret,
      eventTypes: params.eventTypes.length > 0 ? params.eventTypes : ['*'],
      ownerAddress: params.ownerAddress,
      createdAt: new Date(),
      active: true,
    };

    this.subscriptions.set(id, sub);
    return sub;
  }

  public getSubscriptions(ownerAddress?: string): WebhookSubscription[] {
    const all = Array.from(this.subscriptions.values());
    if (ownerAddress) {
      return all.filter((s) => s.ownerAddress === ownerAddress);
    }
    return all;
  }

  public getSubscription(id: string): WebhookSubscription | undefined {
    return this.subscriptions.get(id);
  }

  public removeSubscription(id: string): boolean {
    return this.subscriptions.delete(id);
  }

  public queueEvent(eventType: string, payload: Record<string, unknown>): void {
    const matchingSubs = Array.from(this.subscriptions.values()).filter(
      (sub) => sub.active && (sub.eventTypes.includes('*') || sub.eventTypes.includes(eventType))
    );

    for (const sub of matchingSubs) {
      const attempt: WebhookDeliveryAttempt = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        subscriptionId: sub.id,
        eventType,
        payload,
        attemptCount: 0,
        maxAttempts: 5,
        status: 'PENDING',
        createdAt: new Date(),
      };

      this.deliveryQueue.push(attempt);
    }

    this.processQueue();
  }

  public calculateNextAttempt(attemptNumber: number): number {
    // Exponential backoff: 2s, 4s, 8s, 16s, 32s (with jitter)
    const base = 2000;
    const factor = Math.pow(2, attemptNumber);
    const jitter = Math.floor(Math.random() * 500);
    return base * factor + jitter;
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing || this.deliveryQueue.length === 0) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      const readyIndex = this.deliveryQueue.findIndex(
        (item) => !item.nextAttemptAt || item.nextAttemptAt <= now
      );

      if (readyIndex === -1) {
        this.isProcessing = false;
        return;
      }

      const item = this.deliveryQueue.splice(readyIndex, 1)[0];
      const sub = this.subscriptions.get(item.subscriptionId);

      if (!sub || !sub.active) {
        item.status = 'DEAD_LETTER';
        item.error = 'Subscription inactive or deleted';
        this.archiveAttempt(item);
        this.isProcessing = false;
        return;
      }

      item.attemptCount++;
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = WebhookDispatcherService.signPayload(sub.secret, item.payload, timestamp);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(sub.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StrataFlow-Signature': signature,
            'X-StrataFlow-Timestamp': timestamp.toString(),
            'X-StrataFlow-Event': item.eventType,
            'User-Agent': 'StrataFlow-Webhook-Dispatcher/1.0',
          },
          body: JSON.stringify({
            event: item.eventType,
            timestamp,
            data: item.payload,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        item.statusCode = response.status;

        if (response.ok) {
          item.status = 'SUCCESS';
          this.archiveAttempt(item);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Network error during delivery';
        item.error = errorMsg;

        if (item.attemptCount >= item.maxAttempts) {
          item.status = 'DEAD_LETTER';
          this.archiveAttempt(item);
        } else {
          item.status = 'FAILED';
          const delayMs = this.calculateNextAttempt(item.attemptCount);
          item.nextAttemptAt = new Date(Date.now() + delayMs);
          this.deliveryQueue.push(item);
        }
      }
    } finally {
      this.isProcessing = false;
      if (this.deliveryQueue.length > 0) {
        if (!this.timer) {
          this.timer = setTimeout(() => {
            this.timer = null;
            this.processQueue();
          }, 1000);
        }
      }
    }
  }

  private archiveAttempt(attempt: WebhookDeliveryAttempt): void {
    this.deliveryHistory.unshift(attempt);
    if (this.deliveryHistory.length > 2000) {
      this.deliveryHistory.pop();
    }
  }

  public getRecentDeliveries(limit: number = 50, subscriptionId?: string): WebhookDeliveryAttempt[] {
    const list = this.getDeliveryHistory(subscriptionId);
    return list.slice(0, Math.min(100, Math.max(1, limit)));
  }

  public getDeliveryHistory(subscriptionId?: string): WebhookDeliveryAttempt[] {
    if (subscriptionId) {
      return this.deliveryHistory.filter((h) => h.subscriptionId === subscriptionId);
    }
    return this.deliveryHistory;
  }

  public clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.subscriptions.clear();
    this.deliveryQueue = [];
    this.deliveryHistory = [];
  }
}

export const webhookDispatcher = new WebhookDispatcherService();

