FROM node:22-alpine AS dependencies
WORKDIR /app
COPY app/package.json ./package.json
RUN npm install --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY app/server.js ./server.js
EXPOSE 8080
CMD ["node", "server.js"]