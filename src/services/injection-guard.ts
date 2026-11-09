export class InjectionGuard {
  private static readonly SQL_INJECTION_REGEX = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|TRUNCATE)\b)|(--)|(;)/i;
  private static readonly PATH_TRAVERSAL_REGEX = /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/)/i;

  public static detectSqlPatterns(input: string): boolean {
    return this.SQL_INJECTION_REGEX.test(input);
  }

  public static detectPathTraversal(input: string): boolean {
    return this.PATH_TRAVERSAL_REGEX.test(input);
  }

  public static assertSafeInput(input: string): void {
    if (this.detectSqlPatterns(input) || this.detectPathTraversal(input)) {
      throw new Error('Potential injection pattern detected in input parameters');
    }
  }
}
