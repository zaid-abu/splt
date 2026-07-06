export class ServiceError extends Error {
  constructor(message: string, public code: string, public cause?: unknown) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function handleSupabaseError(error: any, defaultMessage: string = 'An unexpected error occurred'): never {
  if (error instanceof ServiceError) {
    throw error;
  }
  
  throw new ServiceError(
    error?.message || defaultMessage,
    error?.code || 'UNKNOWN_ERROR',
    error
  );
}
