export class SchemaValidator {
  public static validateRequired(obj: Record<string, any>, requiredFields: string[]): { valid: boolean; missing: string[] } {
    const missing = requiredFields.filter(f => obj[f] === undefined || obj[f] === null || obj[f] === '');
    return {
      valid: missing.length === 0,
      missing,
    };
  }
}
