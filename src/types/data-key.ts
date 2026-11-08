import { xdr, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';

export type ContractDataKeyType =
  | { kind: 'Admin' }
  | { kind: 'AgreementCounter' }
  | { kind: 'Agreement'; id: bigint }
  | { kind: 'Milestone'; agreementId: bigint; index: number }
  | { kind: 'Dispute'; agreementId: bigint }
  | { kind: 'FeeConfig' }
  | { kind: 'IsPaused' };

export class ContractDataKeyHelper {
  public static toScVal(key: ContractDataKeyType): xdr.ScVal {
    switch (key.kind) {
      case 'Admin':
        return xdr.ScVal.scvSymbol('Admin');
      case 'AgreementCounter':
        return xdr.ScVal.scvSymbol('AgreementCounter');
      case 'FeeConfig':
        return xdr.ScVal.scvSymbol('FeeConfig');
      case 'IsPaused':
        return xdr.ScVal.scvSymbol('IsPaused');
      case 'Agreement':
        return xdr.ScVal.scvVec([
          xdr.ScVal.scvSymbol('Agreement'),
          nativeToScVal(key.id, { type: 'u64' }),
        ]);
      case 'Milestone':
        return xdr.ScVal.scvVec([
          xdr.ScVal.scvSymbol('Milestone'),
          nativeToScVal(key.agreementId, { type: 'u64' }),
          nativeToScVal(key.index, { type: 'u32' }),
        ]);
      case 'Dispute':
        return xdr.ScVal.scvVec([
          xdr.ScVal.scvSymbol('Dispute'),
          nativeToScVal(key.agreementId, { type: 'u64' }),
        ]);
    }
  }

  public static fromScVal(val: xdr.ScVal): ContractDataKeyType | null {
    if (val.switch() === xdr.ScValType.scvSymbol()) {
      const sym = val.sym().toString();
      if (sym === 'Admin') return { kind: 'Admin' };
      if (sym === 'AgreementCounter') return { kind: 'AgreementCounter' };
      if (sym === 'FeeConfig') return { kind: 'FeeConfig' };
      if (sym === 'IsPaused') return { kind: 'IsPaused' };
      return null;
    }

    if (val.switch() === xdr.ScValType.scvVec()) {
      const vec = val.vec();
      if (!vec || vec.length === 0) return null;
      const tag = vec[0];
      if (tag.switch() !== xdr.ScValType.scvSymbol()) return null;
      const sym = tag.sym().toString();

      if (sym === 'Agreement' && vec.length >= 2) {
        const id = BigInt(scValToNative(vec[1]));
        return { kind: 'Agreement', id };
      }

      if (sym === 'Milestone' && vec.length >= 3) {
        const agreementId = BigInt(scValToNative(vec[1]));
        const index = Number(scValToNative(vec[2]));
        return { kind: 'Milestone', agreementId, index };
      }

      if (sym === 'Dispute' && vec.length >= 2) {
        const agreementId = BigInt(scValToNative(vec[1]));
        return { kind: 'Dispute', agreementId };
      }
    }

    return null;
  }
}
