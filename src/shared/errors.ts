/**
 * Application error hierarchy for consistent HTTP error responses.
 *
 * All errors thrown by services/repositories should extend AppError
 * so the API layer can map them to appropriate HTTP status codes.
 */

/** Base application error with HTTP status code. */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

/** 404 — Requested entity does not exist. */
export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(404, `${entity} 不存在`);
    this.name = "NotFoundError";
  }
}

/** 400 — Request body or parameters failed validation. */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = "ValidationError";
  }
}

/** 409 — Conflict with existing resource (e.g., duplicate key). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = "ConflictError";
  }
}
