import { randomInt, randomBytes } from 'crypto';

export class AuthCodeGenerator {
  public static generateNumericCode(digits: number = 6): string {
    let code = '';
    for (let i = 0; i < digits; i++) {
      code += randomInt(0, 10).toString();
    }
    return code;
  }

  public static generateAlphanumericToken(length: number = 8): string {
    return randomBytes(length).toString('hex').slice(0, length).toUpperCase();
  }
}
