# ---- test stage: the image can only be built if the unit tests pass ----
FROM node:22-alpine AS test
WORKDIR /app
COPY app/package.json ./
COPY app/src ./src
COPY app/test ./test
RUN npm test

# ---- runtime stage: only the app code, running as a non-root user ----
FROM node:22-alpine AS runtime
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION NODE_ENV=production PORT=3000
WORKDIR /app
# copy FROM the test stage: BuildKit skips stages nothing depends on,
# so this is what forces the tests to run before the image can be built
COPY --from=test /app/package.json ./
COPY --from=test /app/src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "src/server.js"]
