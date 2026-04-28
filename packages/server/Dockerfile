FROM node:22-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
RUN npm ci --workspaces --if-present
COPY packages/shared/src packages/shared/src
COPY packages/shared/tsconfig.json packages/shared/tsup.config.ts packages/shared/
RUN npm run build -w packages/shared
COPY packages/server/src packages/server/src
COPY packages/server/tsconfig.json packages/server/
RUN npm run build -w packages/server

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/shared/dist /app/packages/shared/dist
COPY --from=builder /app/packages/server/dist /app/packages/server/dist
COPY --from=builder /app/packages/server/package.json /app/packages/server/package.json
ENV PORT=3000
EXPOSE 3000
CMD ["node", "packages/server/dist/index.js"]
