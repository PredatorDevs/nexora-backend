import pino from 'pino';

export function createLogger(
  { level = 'info', enabled = true } = {},
  destination,
) {
  return pino(
    {
      enabled,
      level,
      base: undefined,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          '*.password',
          '*.token',
          '*.secret',
        ],
        censor: '[REDACTED]',
      },
    },
    destination,
  );
}
