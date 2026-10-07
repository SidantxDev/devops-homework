FROM node:22-alpine AS dependencies
WORKDIR /app
COPY app/package.json ./package.json
# mkdir: npm does not create node_modules when there are no dependencies
RUN npm install --omit=dev && mkdir -p node_modules

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY app/server.js ./server.js
EXPOSE 8080
CMD ["node", "server.js"]