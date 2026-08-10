import { describe, expect, it } from 'vitest';

import { loadEnvironment } from '../../../src/config/environment.js';

const validEnvironment = {
  NODE_ENV: 'development',
  PORT: '3000',
  DATABASE_URL: 'mysql://app:secret@localhost:3306/app',
  TEST_DATABASE_URL: 'mysql://app:secret@localhost:3306/app_test',
  ACCESS_TOKEN_SECRET: 'a-secure-secret-with-at-least-32-characters',
  ACCESS_TOKEN_EXPIRES_IN: '10m',
  ACCESS_TOKEN_ISSUER: 'test-backend',
  ACCESS_TOKEN_AUDIENCE: 'test-clients',
  REFRESH_TOKEN_EXPIRES_IN_DAYS: '30',
  REFRESH_COOKIE_NAME: 'app_refresh_token',
  COOKIE_SECURE: 'false',
  COOKIE_SAME_SITE: 'lax',
  CORS_ALLOWED_ORIGINS: 'http://localhost:5173,https://example.com',
  LOG_LEVEL: 'debug',
  TRUST_PROXY: 'false',
  JSON_BODY_LIMIT: '100kb',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '100',
  LOGIN_RATE_LIMIT_WINDOW_MS: '900000',
  LOGIN_RATE_LIMIT_MAX: '5',
  SERVE_FRONTEND: 'false',
  FRONTEND_DIST_PATH: '',
};

describe('loadEnvironment', () => {
  it('parses a valid environment', () => {
    const environment = loadEnvironment(validEnvironment);

    expect(environment).toMatchObject({
      nodeEnv: 'development',
      isDevelopment: true,
      port: 3000,
      databaseUrl: validEnvironment.DATABASE_URL,
      cookie: { secure: false, sameSite: 'lax' },
      cors: {
        allowedOrigins: ['http://localhost:5173', 'https://example.com'],
      },
      frontend: { enabled: false, distPath: null },
      http: {
        trustProxy: false,
        jsonBodyLimit: '100kb',
        rateLimit: { windowMs: 900000, limit: 100 },
        loginRateLimit: { windowMs: 900000, limit: 5 },
        serverTimeouts: {
          requestTimeoutMs: 30000,
          headersTimeoutMs: 15000,
          keepAliveTimeoutMs: 5000,
          shutdownTimeoutMs: 10000,
        },
      },
    });
  });

  it('fails when required variables are missing', () => {
    expect(() => loadEnvironment({})).toThrow(
      'Invalid environment configuration',
    );
  });

  it('rejects ports outside the valid range', () => {
    expect(() =>
      loadEnvironment({ ...validEnvironment, PORT: '70000' }),
    ).toThrow('Invalid environment configuration');
  });

  it('validates server timeout bounds and ordering', () => {
    expect(() =>
      loadEnvironment({ ...validEnvironment, REQUEST_TIMEOUT_MS: '999' }),
    ).toThrow('REQUEST_TIMEOUT_MS');
    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        REQUEST_TIMEOUT_MS: '10000',
        HEADERS_TIMEOUT_MS: '11000',
      }),
    ).toThrow('HEADERS_TIMEOUT_MS: Must not exceed REQUEST_TIMEOUT_MS');
  });

  it('uses the isolated database in the test environment', () => {
    const environment = loadEnvironment({
      ...validEnvironment,
      NODE_ENV: 'test',
    });

    expect(environment.databaseUrl).toBe(validEnvironment.TEST_DATABASE_URL);
    expect(environment.isTest).toBe(true);
  });

  it('rejects a shared development and test database', () => {
    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        TEST_DATABASE_URL: validEnvironment.DATABASE_URL,
      }),
    ).toThrow('TEST_DATABASE_URL: Must be different from DATABASE_URL');
  });

  it('requires secure cookies in production', () => {
    expect(() =>
      loadEnvironment({ ...validEnvironment, NODE_ENV: 'production' }),
    ).toThrow('COOKIE_SECURE: Must be true in production');
  });

  it('requires a frontend path only when static serving is enabled', () => {
    expect(() =>
      loadEnvironment({ ...validEnvironment, SERVE_FRONTEND: 'true' }),
    ).toThrow('FRONTEND_DIST_PATH: Is required');

    expect(
      loadEnvironment({
        ...validEnvironment,
        SERVE_FRONTEND: 'true',
        FRONTEND_DIST_PATH: '/app/public',
      }).frontend,
    ).toEqual({ enabled: true, distPath: '/app/public' });
  });

  it('allows the frontend path to be absent when static serving is disabled', () => {
    const environmentWithoutFrontendPath = { ...validEnvironment };
    delete environmentWithoutFrontendPath.FRONTEND_DIST_PATH;

    expect(loadEnvironment(environmentWithoutFrontendPath).frontend).toEqual({
      enabled: false,
      distPath: null,
    });
  });

  it('returns immutable configuration and does not leak secret values in errors', () => {
    const environment = loadEnvironment(validEnvironment);

    expect(Object.isFrozen(environment)).toBe(true);
    expect(Object.isFrozen(environment.auth)).toBe(true);

    try {
      loadEnvironment({ ...validEnvironment, PORT: 'invalid' });
    } catch (error) {
      expect(error.message).not.toContain(validEnvironment.ACCESS_TOKEN_SECRET);
      expect(error.message).not.toContain('mysql://app:secret');
    }
  });

  it('requires all initial administrator values together', () => {
    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        INITIAL_ADMIN_EMAIL: 'admin@example.test',
      }),
    ).toThrow('All initial administrator variables must be provided together');

    expect(
      loadEnvironment({
        ...validEnvironment,
        INITIAL_ADMIN_EMAIL: 'ADMIN@example.test',
        INITIAL_ADMIN_PASSWORD: 'a-secure-admin-password',
        INITIAL_ADMIN_DISPLAY_NAME: 'Initial Admin',
      }).initialAdmin,
    ).toEqual({
      email: 'admin@example.test',
      password: 'a-secure-admin-password',
      displayName: 'Initial Admin',
    });
  });
});
