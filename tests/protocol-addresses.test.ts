import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ProtocolAddressRegistry, PROTOCOL_NETWORKS } from '../src/config/protocol-addresses';

describe('ProtocolAddressRegistry Unit Tests', () => {
  it('resolves TESTNET configuration by default', () => {
    const config = ProtocolAddressRegistry.getActiveConfig('TESTNET');
    assert.strictEqual(config.network, 'TESTNET');
    assert.ok(config.rpcUrl.includes('testnet.stellar.org'));
    assert.ok(config.networkPassphrase.includes('Test SDF Network'));
    assert.ok(config.contractId.startsWith('C'));
  });

  it('resolves MAINNET when passed PUBLIC alias', () => {
    const config = ProtocolAddressRegistry.getActiveConfig('PUBLIC');
    assert.strictEqual(config.network, 'MAINNET');
    assert.ok(config.rpcUrl.includes('mainnet.stellar.org'));
    assert.ok(config.networkPassphrase.includes('Public Global Stellar Network'));
  });

  it('validates genuine StrKey contract identifiers', () => {
    const validContract = 'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H';
    assert.strictEqual(ProtocolAddressRegistry.isValidContractAddress(validContract), true);

    const invalidAddress = 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS'; // account, not contract
    assert.strictEqual(ProtocolAddressRegistry.isValidContractAddress(invalidAddress), false);

    const randomGibberish = 'not-a-valid-stellar-address';
    assert.strictEqual(ProtocolAddressRegistry.isValidContractAddress(randomGibberish), false);
  });

  it('assertValidContractAddress throws descriptive error on invalid address', () => {
    assert.throws(
      () => {
        ProtocolAddressRegistry.assertValidContractAddress('INVALID', 'StrataFlow Contract');
      },
      /Invalid Soroban StrataFlow Contract/
    );
  });
});
