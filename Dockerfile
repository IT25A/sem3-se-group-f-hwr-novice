FROM node:26-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

COPY .env.example .env
RUN npm run build
RUN npm prune --omit=dev

FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts/migrate.js ./scripts/migrate.js

RUN mkdir -p /data && chown node:node /data

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health',{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "node scripts/migrate.js && exec node build"]
