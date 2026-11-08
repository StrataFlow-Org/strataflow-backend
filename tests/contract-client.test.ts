import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ContractClientService } from '../src/services/contract-client';

describe('ContractClientService Unit Tests', () => {
  it('initializes with testnet configuration', () => {
    const client = new ContractClientService('TESTNET');
    const config = client.getNetworkConfig();

    assert.strictEqual(config.network, 'TESTNET');
    assert.ok(client.getContractId().startsWith('C'));
  });

  it('queries protocol fee configuration', async () => {
    const client = new ContractClientService('TESTNET');
    const feeConfig = await client.getProtocolFee();

    assert.strictEqual(feeConfig.feeBps, 50);
    assert.ok(feeConfig.recipient.startsWith('G'));
  });

  it('queries version with fallback default when offline', async () => {
    const client = new ContractClientService('TESTNET');
    const version = await client.getVersion();

    assert.ok(version.match(/^\d+\.\d+\.\d+$/));
  });

  it('queries pause state with boolean result', async () => {
    const client = new ContractClientService('TESTNET');
    const isPaused = await client.isPaused();

    assert.strictEqual(typeof isPaused, 'boolean');
  });
});

