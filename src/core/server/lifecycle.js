export function configureServerTimeouts(
  server,
  { requestTimeoutMs, headersTimeoutMs, keepAliveTimeoutMs },
) {
  server.requestTimeout = requestTimeoutMs;
  server.headersTimeout = headersTimeoutMs;
  server.keepAliveTimeout = keepAliveTimeoutMs;
}

export function createGracefulShutdown({
  server,
  disconnect,
  logger,
  timeoutMs,
  setExitCode = (code) => {
    process.exitCode = code;
  },
}) {
  let shutdownPromise;

  return function shutdown(signal) {
    if (shutdownPromise) return shutdownPromise;

    logger.info({ signal }, 'Graceful shutdown started');
    shutdownPromise = new Promise((resolve) => {
      let finished = false;
      let timer;

      const finish = async (exitCode) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try {
          await disconnect();
        } catch (error) {
          exitCode = 1;
          logger.error(
            { errorName: error?.name },
            'Database disconnection failed during shutdown',
          );
        }
        setExitCode(exitCode);
        logger.info({ exitCode }, 'Graceful shutdown completed');
        resolve();
      };

      timer = setTimeout(() => {
        logger.error('Graceful shutdown timed out; closing connections');
        server.closeAllConnections?.();
        void finish(1);
      }, timeoutMs);
      timer.unref?.();

      server.close((error) => {
        void finish(error ? 1 : 0);
      });
      server.closeIdleConnections?.();
    });

    return shutdownPromise;
  };
}

export function registerShutdownSignals(shutdown, processRef = process) {
  for (const signal of ['SIGTERM', 'SIGINT']) {
    processRef.once(signal, () => void shutdown(signal));
  }
}
