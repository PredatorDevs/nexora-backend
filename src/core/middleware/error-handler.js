import { Prisma } from '@prisma/client';

import { AppError } from '../errors/app-error.js';
import { errorCodes } from '../errors/error-codes.js';
import { sendError } from '../http/responses.js';

function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.type === 'entity.too.large') {
    return new AppError({
      code: errorCodes.payloadTooLarge,
      message: 'The request payload is too large.',
      statusCode: 413,
      cause: error,
    });
  }

  if (error instanceof SyntaxError && error?.type === 'entity.parse.failed') {
    return new AppError({
      code: errorCodes.validation,
      message: 'The request body contains invalid JSON.',
      statusCode: 400,
      cause: error,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new AppError({
        code: errorCodes.conflict,
        message: 'A resource with the same unique values already exists.',
        statusCode: 409,
        cause: error,
      });
    }

    if (error.code === 'P2025') {
      return new AppError({
        code: errorCodes.notFound,
        message: 'The requested resource was not found.',
        statusCode: 404,
        cause: error,
      });
    }

    return new AppError({
      code: errorCodes.database,
      message: 'The database operation could not be completed.',
      statusCode: 500,
      cause: error,
    });
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return new AppError({
      code: errorCodes.database,
      message: 'The database is temporarily unavailable.',
      statusCode: 503,
      cause: error,
    });
  }

  return new AppError({
    code: errorCodes.internal,
    message: 'An unexpected error occurred.',
    statusCode: 500,
    cause: error,
  });
}

export function errorHandler(error, request, response, _next) {
  const normalizedError = normalizeError(error);

  if (normalizedError.statusCode >= 500) {
    request.log?.error({ err: error, requestId: request.id }, 'Request failed');
  }

  return sendError(response, normalizedError);
}
