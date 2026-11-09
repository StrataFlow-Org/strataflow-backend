export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: number;
    requestId?: string;
  };
}

export class ApiResponseHelper {
  public static success<T>(data: T, requestId?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: Date.now(),
        requestId,
      },
    };
  }

  public static error(message: string, code: string = 'BAD_REQUEST', details?: any, requestId?: string): ApiResponse {
    return {
      success: false,
      error: { code, message, details },
      meta: {
        timestamp: Date.now(),
        requestId,
      },
    };
  }
}
