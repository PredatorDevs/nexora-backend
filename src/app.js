import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { createLogger } from './config/logger.js';
import { AppError } from './core/errors/app-error.js';
import { errorCodes } from './core/errors/error-codes.js';
import { errorHandler } from './core/middleware/error-handler.js';
import { apiNotFound } from './core/middleware/not-found.js';
import { createGeneralRateLimit } from './core/middleware/rate-limit.js';
import { requestId } from './core/middleware/request-id.js';
import { registerRoutes } from './routes/index.js';
import { registerFrontend } from './static/serve-frontend.js';

function createCorsOptions(allowedOrigins) {
  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new AppError({
          code: errorCodes.forbidden,
          message: 'The request origin is not allowed.',
          statusCode: 403,
        }),
      );
    },
  };
}

export function createApp({
  trustProxy = false,
  allowedOrigins = ['http://localhost:5173'],
  jsonBodyLimit = '100kb',
  rateLimit: rateLimitOptions = { windowMs: 15 * 60 * 1000, limit: 100 },
  logger = createLogger({ enabled: false }),
  routes = registerRoutes,
  services = {},
  settings = {},
  frontend = { enabled: false, distPath: null },
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);
  app.locals.services = services;
  app.locals.settings = { allowedOrigins, ...settings };

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (request) => request.id,
    }),
  );
  app.use(helmet());
  app.use(cors(createCorsOptions(allowedOrigins)));
  app.use(compression());
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use(cookieParser());
  app.use(createGeneralRateLimit(rateLimitOptions));

  routes(app);

  app.use('/api', apiNotFound);
  registerFrontend(app, frontend);
  app.use(errorHandler);

  return app;
}
