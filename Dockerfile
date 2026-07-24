# Property Vault pilot — production image (Postgres-backed)
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Production runs on Postgres: regenerate the client for the pg dialect
RUN node scripts/set-db-provider.mjs postgresql \
  && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/next.config.mjs ./
COPY --from=build /app/src/generated ./src/generated
EXPOSE 3000
# Apply migrations on boot, then serve. Seed manually once (see DEPLOY.md).
CMD ["sh", "-c", "node scripts/apply-migrations-pg.mjs && npx next start -p ${PORT:-3000}"]
