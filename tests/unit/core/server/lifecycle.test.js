import { EventEmitter } from 'node:events';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  configureServerTimeouts,
  createGracefulShutdown,
  registerShutdownSignals,
} from '../../../../src/core/server/lifecycle.js';

const logger = () => ({ info: vi.fn(), error: vi.fn() });

afterEach(() => vi.useRealTimers());

describe('server lifecycle', () => {
  it('applies the configured HTTP timeouts', () => {
    const server = {};
    configureServerTimeouts(server, {
      requestTimeoutMs: 30_000,
      headersTimeoutMs: 15_000,
      keepAliveTimeoutMs: 5_000,
    });

    expect(server).toMatchObject({
      requestTimeout: 30_000,
      headersTimeout: 15_000,
      keepAliveTimeout: 5_000,
    });
  });

  it('stops accepting traffic, closes idle connections, and disconnects once', async () => {
    const server = {
      close: vi.fn((callback) => callback()),
      closeIdleConnections: vi.fn(),
    };
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const setExitCode = vi.fn();
    const shutdown = createGracefulShutdown({
      server,
      disconnect,
      logger: logger(),
      timeoutMs: 1_000,
      setExitCode,
    });

    const first = shutdown('SIGTERM');
    const second = shutdown('SIGINT');
    expect(first).toBe(second);
    await first;

    expect(server.close).toHaveBeenCalledOnce();
    expect(server.closeIdleConnections).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(setExitCode).toHaveBeenCalledWith(0);
  });

  it('forces remaining connections closed after the shutdown deadline', async () => {
    vi.useFakeTimers();
    const server = {
      close: vi.fn(),
      closeIdleConnections: vi.fn(),
      closeAllConnections: vi.fn(),
    };
    const setExitCode = vi.fn();
    const shutdown = createGracefulShutdown({
      server,
      disconnect: vi.fn().mockResolvedValue(undefined),
      logger: logger(),
      timeoutMs: 1_000,
      setExitCode,
    });

    const completion = shutdown('SIGTERM');
    await vi.advanceTimersByTimeAsync(1_000);
    await completion;

    expect(server.closeAllConnections).toHaveBeenCalledOnce();
    expect(setExitCode).toHaveBeenCalledWith(1);
  });

  it('uses a failure exit code when server close or database disconnect fails', async () => {
    const server = {
      close: vi.fn((callback) => callback(new Error('close failed'))),
      closeIdleConnections: vi.fn(),
    };
    const testLogger = logger();
    const setExitCode = vi.fn();
    const shutdown = createGracefulShutdown({
      server,
      disconnect: vi.fn().mockRejectedValue(new Error('disconnect failed')),
      logger: testLogger,
      timeoutMs: 1_000,
      setExitCode,
    });

    await shutdown('SERVER_ERROR');

    expect(setExitCode).toHaveBeenCalledWith(1);
    expect(testLogger.error).toHaveBeenCalledWith(
      { errorName: 'Error' },
      'Database disconnection failed during shutdown',
    );
  });

  it('registers both termination signals', () => {
    const processRef = new EventEmitter();
    const shutdown = vi.fn();
    registerShutdownSignals(shutdown, processRef);

    processRef.emit('SIGTERM');
    processRef.emit('SIGINT');

    expect(shutdown).toHaveBeenCalledWith('SIGTERM');
    expect(shutdown).toHaveBeenCalledWith('SIGINT');
  });
});
