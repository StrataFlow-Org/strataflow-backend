export interface WebhookSubscription {
  id: string;
  url: string;
  secret: string;
  eventTypes: string[]; // e.g. ['AgreementCreated', 'MilestoneApproved', '*']
  ownerAddress: string;
  createdAt: Date;
  active: boolean;
}

export type DeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'DEAD_LETTER';

export interface WebhookDeliveryAttempt {
  id: string;
  subscriptionId: string;
  eventType: string;
  payload: Record<string, unknown>;
  statusCode?: number;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt?: Date;
  status: DeliveryStatus;
  responseBody?: string;
  error?: string;
  createdAt: Date;
}

