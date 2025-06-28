

// Standardized error type
export interface AppError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Fetch with retry logic
export async function fetchWithRetry<T>(
  fn: () => Promise<Response>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: AppError | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fn();
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `Request failed with status ${response.status}`) as AppError;
        error.status = response.status;
        error.details = errorData;
        throw error;
      }
      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

// Centralized error logging
export function logError(context: string, error: unknown) {
  const appError: AppError = error instanceof Error ? error : new Error('Unknown error');
  console.error(`[${context}] Error:`, {
    message: appError.message,
    status: appError.status,
    code: appError.code,
    details: appError.details,
    stack: appError.stack,
  });
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => Promise<void> {
  let timeout: NodeJS.Timeout | null = null;
  return async (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    return new Promise((resolve) => {
      timeout = setTimeout(async () => {
        await fn(...args);
        resolve();
      }, wait);
    });
  };
}