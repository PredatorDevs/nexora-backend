import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const durationString = z
  .string()
  .regex(/^\d+[smhd]$/, 'Must be a duration such as 10m, 2h, or 1d');

const mysqlUrl = z
  .string()
  .min(1)
  .regex(/^mysql:\/\//, 'Must use the mysql:// protocol');

const allowedOrigins = z
  .string()
  .min(1)
  .transform((value) => value.split(',').map((origin) => origin.trim()))
  .pipe(z.array(z.string().url()).min(1));

const optionalString = (schema) =>
  z.preprocess(
    (value) => (value === '' ? undefined : value),
    schema.optional(),
  );

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: mysqlUrl,
    TEST_DATABASE_URL: optionalString(mysqlUrl),
    ACCESS_TOKEN_SECRET: z.string().min(32),
    ACCESS_TOKEN_EXPIRES_IN: durationString,
    ACCESS_TOKEN_ISSUER: z.string().min(1).default('nexora-backend'),
    ACCESS_TOKEN_AUDIENCE: z.string().min(1).default('nexora-clients'),
    REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive(),
    REFRESH_COOKIE_NAME: z.string().min(1),
    COOKIE_SECURE: booleanString,
    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']),
    CORS_ALLOWED_ORIGINS: allowedOrigins,
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
    TRUST_PROXY: booleanString,
    JSON_BODY_LIMIT: z.string().regex(/^\d+(b|kb|mb)$/i),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
    RATE_LIMIT_MAX: z.coerce.number().int().positive(),
    LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(900000),
    LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
    REQUEST_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(300_000)
      .default(30_000),
    HEADERS_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(300_000)
      .default(15_000),
    KEEP_ALIVE_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(120_000)
      .default(5_000),
    SHUTDOWN_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(120_000)
      .default(10_000),
    SERVE_FRONTEND: booleanString,
    FRONTEND_DIST_PATH: z.string().default(''),
    PUBLIC_APP_URL: optionalString(z.string().url()),
    MAIL_TRANSPORT: z.enum(['log', 'resend']).default('log'),
    RESEND_API_KEY: optionalString(z.string().min(1)),
    MAIL_FROM_EMAIL: optionalString(z.string().email().max(191)),
    MAIL_FROM_NAME: z.string().trim().min(1).max(120).default('Nexora ERP'),
    MAIL_REPLY_TO: optionalString(z.string().email().max(191)),
    STORAGE_DRIVER: z.enum(['disabled', 's3']).default('disabled'),
    AWS_REGION: optionalString(z.string().min(1).max(64)),
    AWS_S3_BUCKET: optionalString(z.string().min(3).max(63)),
    AWS_ACCESS_KEY_ID: optionalString(z.string().min(1)),
    AWS_SECRET_ACCESS_KEY: optionalString(z.string().min(1)),
    AWS_SESSION_TOKEN: optionalString(z.string().min(1)),
    AWS_S3_PUBLIC_BASE_URL: optionalString(z.string().url()),
    S3_UPLOAD_EXPIRES_IN_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(900)
      .default(300),
    S3_READ_EXPIRES_IN_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86400)
      .default(900),
    S3_MAX_IMAGE_SIZE_BYTES: z.coerce
      .number()
      .int()
      .min(1024)
      .max(20_000_000)
      .default(5_000_000),
    INITIAL_ADMIN_EMAIL: optionalString(
      z.string().trim().toLowerCase().email().max(191),
    ),
    INITIAL_ADMIN_PASSWORD: optionalString(z.string().min(12).max(1024)),
    INITIAL_ADMIN_DISPLAY_NAME: optionalString(
      z.string().trim().min(1).max(120),
    ),
  })
  .superRefine((environment, context) => {
    if (environment.HEADERS_TIMEOUT_MS > environment.REQUEST_TIMEOUT_MS) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must not exceed REQUEST_TIMEOUT_MS',
        path: ['HEADERS_TIMEOUT_MS'],
      });
    }
    if (environment.NODE_ENV === 'production' && !environment.COOKIE_SECURE) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must be true in production',
        path: ['COOKIE_SECURE'],
      });
    }

    if (environment.COOKIE_SAME_SITE === 'none' && !environment.COOKIE_SECURE) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must be true when COOKIE_SAME_SITE is none',
        path: ['COOKIE_SECURE'],
      });
    }

    if (
      environment.SERVE_FRONTEND &&
      environment.FRONTEND_DIST_PATH.trim().length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Is required when SERVE_FRONTEND is true',
        path: ['FRONTEND_DIST_PATH'],
      });
    }

    if (environment.NODE_ENV === 'test' && !environment.TEST_DATABASE_URL) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Is required when NODE_ENV is test',
        path: ['TEST_DATABASE_URL'],
      });
    }

    if (
      environment.TEST_DATABASE_URL &&
      environment.DATABASE_URL === environment.TEST_DATABASE_URL
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must be different from DATABASE_URL',
        path: ['TEST_DATABASE_URL'],
      });
    }
    if (
      environment.MAIL_TRANSPORT === 'resend' &&
      (!environment.RESEND_API_KEY ||
        !environment.MAIL_FROM_EMAIL ||
        !environment.PUBLIC_APP_URL)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'RESEND_API_KEY, MAIL_FROM_EMAIL, and PUBLIC_APP_URL are required when MAIL_TRANSPORT is resend',
        path: ['MAIL_TRANSPORT'],
      });
    }
    if (environment.STORAGE_DRIVER === 's3') {
      for (const field of [
        'AWS_REGION',
        'AWS_S3_BUCKET',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
      ]) {
        if (!environment[field])
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Is required when STORAGE_DRIVER is s3',
            path: [field],
          });
      }
    }

    const adminValues = [
      environment.INITIAL_ADMIN_EMAIL,
      environment.INITIAL_ADMIN_PASSWORD,
      environment.INITIAL_ADMIN_DISPLAY_NAME,
    ];
    if (adminValues.some(Boolean) && !adminValues.every(Boolean)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'All initial administrator variables must be provided together',
        path: ['INITIAL_ADMIN_EMAIL'],
      });
    }
  });

function deepFreeze(value) {
  Object.values(value).forEach((nestedValue) => {
    if (nestedValue && typeof nestedValue === 'object') {
      deepFreeze(nestedValue);
    }
  });

  return Object.freeze(value);
}

export function loadEnvironment(input = process.env) {
  const result = environmentSchema.safeParse(input);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  const values = result.data;

  return deepFreeze({
    nodeEnv: values.NODE_ENV,
    isDevelopment: values.NODE_ENV === 'development',
    isTest: values.NODE_ENV === 'test',
    isProduction: values.NODE_ENV === 'production',
    port: values.PORT,
    databaseUrl:
      values.NODE_ENV === 'test'
        ? values.TEST_DATABASE_URL
        : values.DATABASE_URL,
    auth: {
      accessTokenSecret: values.ACCESS_TOKEN_SECRET,
      accessTokenExpiresIn: values.ACCESS_TOKEN_EXPIRES_IN,
      accessTokenIssuer: values.ACCESS_TOKEN_ISSUER,
      accessTokenAudience: values.ACCESS_TOKEN_AUDIENCE,
      refreshTokenExpiresInDays: values.REFRESH_TOKEN_EXPIRES_IN_DAYS,
      refreshCookieName: values.REFRESH_COOKIE_NAME,
    },
    cookie: {
      secure: values.COOKIE_SECURE,
      sameSite: values.COOKIE_SAME_SITE,
    },
    cors: {
      allowedOrigins: values.CORS_ALLOWED_ORIGINS,
    },
    logging: {
      level: values.LOG_LEVEL,
    },
    http: {
      trustProxy: values.TRUST_PROXY,
      jsonBodyLimit: values.JSON_BODY_LIMIT,
      rateLimit: {
        windowMs: values.RATE_LIMIT_WINDOW_MS,
        limit: values.RATE_LIMIT_MAX,
      },
      loginRateLimit: {
        windowMs: values.LOGIN_RATE_LIMIT_WINDOW_MS,
        limit: values.LOGIN_RATE_LIMIT_MAX,
      },
      serverTimeouts: {
        requestTimeoutMs: values.REQUEST_TIMEOUT_MS,
        headersTimeoutMs: values.HEADERS_TIMEOUT_MS,
        keepAliveTimeoutMs: values.KEEP_ALIVE_TIMEOUT_MS,
        shutdownTimeoutMs: values.SHUTDOWN_TIMEOUT_MS,
      },
    },
    frontend: {
      enabled: values.SERVE_FRONTEND,
      distPath: values.FRONTEND_DIST_PATH.trim() || null,
    },
    publicAppUrl: values.PUBLIC_APP_URL ?? values.CORS_ALLOWED_ORIGINS[0],
    mail: {
      transport: values.MAIL_TRANSPORT,
      resendApiKey: values.RESEND_API_KEY,
      fromEmail: values.MAIL_FROM_EMAIL,
      fromName: values.MAIL_FROM_NAME,
      replyTo: values.MAIL_REPLY_TO,
    },
    storage: {
      driver: values.STORAGE_DRIVER,
      region: values.AWS_REGION,
      bucket: values.AWS_S3_BUCKET,
      accessKeyId: values.AWS_ACCESS_KEY_ID,
      secretAccessKey: values.AWS_SECRET_ACCESS_KEY,
      sessionToken: values.AWS_SESSION_TOKEN,
      publicBaseUrl: values.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? null,
      uploadExpiresInSeconds: values.S3_UPLOAD_EXPIRES_IN_SECONDS,
      readExpiresInSeconds: values.S3_READ_EXPIRES_IN_SECONDS,
      maxImageSizeBytes: values.S3_MAX_IMAGE_SIZE_BYTES,
    },
    initialAdmin: values.INITIAL_ADMIN_EMAIL
      ? {
          email: values.INITIAL_ADMIN_EMAIL,
          password: values.INITIAL_ADMIN_PASSWORD,
          displayName: values.INITIAL_ADMIN_DISPLAY_NAME,
        }
      : null,
  });
}
