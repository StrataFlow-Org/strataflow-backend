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

  public registerSubscription(params: {
    url: string;
    eventTypes: string[];
    ownerAddress: string;
    secret?: string;
  }): WebhookSubscription {
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

