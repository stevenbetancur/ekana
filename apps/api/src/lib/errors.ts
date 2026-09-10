import { ERROR_CODES } from '@ekana/shared';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (message = 'Recurso no encontrado') =>
  new AppError(404, ERROR_CODES.NOT_FOUND, message);

export const forbidden = (message = 'No tienes permiso para esta acción') =>
  new AppError(403, ERROR_CODES.FORBIDDEN, message);

export const unauthenticated = (message = 'Debes iniciar sesión') =>
  new AppError(401, ERROR_CODES.UNAUTHENTICATED, message);

export const conflict = (message: string) => new AppError(409, ERROR_CODES.CONFLICT, message);
