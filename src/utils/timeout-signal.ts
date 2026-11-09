export class TimeoutSignal {
  public static withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string = 'Operation'): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }
}
