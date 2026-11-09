export class TransactionManager {
  public static async withTransaction<T>(
    operation: () => Promise<T>,
    onErrorRollback?: () => Promise<void>
  ): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      if (onErrorRollback) {
        try {
          await onErrorRollback();
        } catch (rollbackErr) {
          console.error('Error during transaction rollback:', rollbackErr);
        }
      }
      throw err;
    }
  }
}
