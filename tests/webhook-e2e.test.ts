import { test } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { webhookDispatcher, WebhookDispatcherService } from '../src/services/webhook-dispatcher.js';
import { indexerService } from '../src/services/soroban-indexer.js';
import { agreementRepo } from '../src/repositories/agreement-repo.js';

test('End-to-End Webhook Dispatch Pipeline', async () => {
  agreementRepo.setUseDatabase(false);
  agreementRepo.clearInMemory();
  webhookDispatcher.clear();

  let receivedRequest: any = null;

  // 1. Create a local mock webhook destination server
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      receivedRequest = {
        headers: req.headers,
        body: JSON.parse(body),
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const webhookUrl = `http://127.0.0.1:${port}/webhook-endpoint`;

  // 2. Register webhook subscription
  const sub = webhookDispatcher.registerSubscription({
    url: webhookUrl,
    eventTypes: ['AgreementCreated'],
    ownerAddress: 'GB_OWNER_E2E',
  });

  // 3. Ingest an event through indexer
  await indexerService.processDecodedEvent({
    id: 'evt_e2e_101',
    contractId: 'C_STRATAFLOW_TEST',
    ledger: 99999,
    timestamp: new Date().toISOString(),
    type: 'AgreementCreated',
    agreementId: '9001',
    topicDetails: [],
    data: {
      client: 'GC_CLIENT_E2E',
      provider: 'GB_PROVIDER_E2E',
      amount: '5000000',
    },
  });

  // Allow dispatch queue to execute
  await new Promise((r) => setTimeout(r, 600));

  // 4. Assert webhook was received
  assert.ok(receivedRequest, 'Destination server should have received the webhook');
  assert.strictEqual(receivedRequest.body.event, 'AgreementCreated');
  assert.strictEqual(receivedRequest.body.data.agreementId, '9001');

  // Verify HMAC header
  const signature = receivedRequest.headers['x-strataflow-signature'];
  const timestamp = parseInt(receivedRequest.headers['x-strataflow-timestamp'], 10);
  assert.ok(signature, 'Signature header must be present');

  const isValidSig = WebhookDispatcherService.verifySignature(
    sub.secret,
    receivedRequest.body.data,
    signature,
    timestamp
  );
  assert.strictEqual(isValidSig, true);

  // Close mock server
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

