export class HppGuard {
  public static sanitizeQueryParam(val: string | string[] | undefined): string | undefined {
    if (val === undefined) return undefined;
    if (Array.isArray(val)) {
      return val[val.length - 1]; // Pick last parameter to prevent pollution
    }
    return val;
  }
}
