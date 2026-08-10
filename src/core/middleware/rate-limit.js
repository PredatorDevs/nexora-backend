import { rateLimit } from 'express-rate-limit';

import { errorCodes } from '../errors/error-codes.js';
import { sendError } from '../http/responses.js';

export function createGeneralRateLimit({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(_request, response) {
      return sendError(response, {
        code: errorCodes.rateLimitExceeded,
        message: 'Too many requests. Please try again later.',
        statusCode: 429,
      });
    },
  });
}
