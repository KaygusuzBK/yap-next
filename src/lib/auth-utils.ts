import { AuthError, AuthRetryableFetchError } from '@supabase/supabase-js';

export function isRetryableError(error: any): boolean {
  return error instanceof AuthRetryableFetchError || 
         error?.name === 'AuthRetryableFetchError' ||
         error?.message?.includes('fetch') ||
         error?.message?.includes('network') ||
         error?.message?.includes('timeout');
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt);
      console.warn(`Auth operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${waitTime}ms...`, error);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

export function handleAuthError(error: any): string {
  if (isRetryableError(error)) {
    return 'Bağlantı hatası. Lütfen tekrar deneyin.';
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Beklenmeyen bir hata oluştu.';
}
