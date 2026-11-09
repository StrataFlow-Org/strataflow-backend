import { StrKey } from '@stellar/stellar-sdk';

export class PubkeyValidator {
  public static isValidEd25519PublicKey(key: string): boolean {
    return StrKey.isValidEd25519PublicKey(key);
  }

  public static isValidContractId(contractId: string): boolean {
    return StrKey.isValidContract(contractId);
  }

  public static isValidHexHash(hash: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(hash);
  }
}
