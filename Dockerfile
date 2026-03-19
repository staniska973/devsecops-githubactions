FROM node:22-alpine3.22

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN apk upgrade --no-cache \
 && npm ci --omit=dev \
 && npm cache clean --force

COPY src ./src

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "require('http').get('http://127.0.0.1:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "src/server.js"]
