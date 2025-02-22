export const AUTH_ERRORS = {
    TOKEN_MISSING: 'Token is missing',
    TOKEN_INVALID: 'Invalid or expired token',
    TOKEN_INVALID_TYPE: 'Invalid token type',
    TOKEN_REVOKED: 'Token has been revoked or expired',
    TOKEN_EXPIRED: 'Token has expired',
    INTERNAL_ERROR: 'An error occurred while verifying the token',
    SAME_PASSWORD: 'New password must be different from the current password',
};

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}