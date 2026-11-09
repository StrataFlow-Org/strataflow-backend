import { randomBytes, createHmac } from 'crypto';

export class CryptoSalt {
  public static generateSalt(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  public static generateCryptographicToken(length: number = 32): string {
    return randomBytes(length).toString('base64url');
  }

  public static hashWithSalt(data: string, salt: string): string {
    return createHmac('sha256', salt).update(data).digest('hex');
  }
}
