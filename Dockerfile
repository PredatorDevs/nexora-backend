# syntax=docker/dockerfile:1

FROM node:22.15.1-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS development
COPY . .
RUN DATABASE_URL=mysql://build:build@localhost:3306/build \
    TEST_DATABASE_URL=mysql://build:build@localhost:3306/build_test \
    npm run prisma:generate
CMD ["node", "--env-file-if-exists=.env", "--watch", "src/server.js"]

FROM development AS migrations
CMD ["npm", "run", "prisma:deploy"]

FROM development AS production-dependencies
RUN npm prune --omit=dev

FROM node:22.15.1-bookworm-slim AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=node:node /app/package.json ./package.json
COPY --from=production-dependencies --chown=node:node /app/prisma ./prisma
COPY --from=production-dependencies --chown=node:node /app/planning ./planning
COPY --from=production-dependencies --chown=node:node /app/src ./src
COPY --from=production-dependencies --chown=node:node /app/scripts ./scripts
COPY --from=production-dependencies --chown=node:node /app/public ./public
USER node
EXPOSE 3000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/api/v1/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"]
CMD ["node", "--env-file-if-exists=.env", "src/server.js"]
