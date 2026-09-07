export class AppError extends Error {
  statusCode: number; // property exists and must be a number
  details?: unknown;
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    if (details !== undefined) this.details = details;
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
