# ---- production dependencies only ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY application/package.json application/package-lock.json ./
RUN npm ci --omit=dev

# ---- unit tests (the runtime stage copies from here, so tests gate the image) ----
FROM node:22-alpine AS test
WORKDIR /app
COPY application/package.json application/package-lock.json ./
RUN npm ci
COPY application/src ./src
COPY application/test ./test
RUN npm test

# ---- runtime: distroless = no shell, no package manager, non-root user ----
FROM gcr.io/distroless/nodejs22-debian13:nonroot AS runtime
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=test /app/package.json ./
COPY --from=test /app/src ./src
EXPOSE 3000
USER nonroot
CMD ["src/server.js"]
