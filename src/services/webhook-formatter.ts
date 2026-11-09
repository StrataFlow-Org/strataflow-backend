export class WebhookFormatter {
  public static formatEvent(eventType: string, payload: any, agreementId: number | string): string {
    return JSON.stringify({
      specversion: '1.0',
      type: eventType,
      source: 'strataflow.protocol.backend',
      subject: `agreement/${agreementId}`,
      time: new Date().toISOString(),
      data: payload,
    });
  }
}
