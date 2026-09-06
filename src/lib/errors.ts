export class AppError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthError extends AppError {
  constructor(message = "Please log in.") {
    super("AUTH_REQUIRED", 401, message);
    this.name = "AuthError";
  }
}

export class ProRequiredError extends AppError {
  constructor(message = "This feature requires a Pro license.") {
    super("PRO_REQUIRED", 403, message);
    this.name = "ProRequiredError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Admin access only.") {
    super("FORBIDDEN", 403, message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super("NOT_FOUND", 404, message);
    this.name = "NotFoundError";
  }
}

export class ServerError extends AppError {
  constructor(message = "Something went wrong.") {
    super("SERVER_ERROR", 500, message);
    this.name = "ServerError";
  }
}
