export class AppError extends Error {
  constructor({ code, message, statusCode, details, cause }) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
