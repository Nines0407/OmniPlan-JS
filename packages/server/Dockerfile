FROM node:22-alpine AS base

FROM base AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
ENV npm_config_build_from_source=true
ENV npm_config_nodedir=/usr/local
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci --workspaces --if-present
COPY packages/shared/src packages/shared/src
COPY tsconfig.json ./
COPY packages/shared/tsconfig.json packages/shared/tsup.config.ts packages/shared/
RUN npm run build -w packages/shared
COPY packages/server/src packages/server/src
COPY packages/server/tsconfig.json packages/server/
COPY packages/server/entrypoint.sh packages/server/
RUN npm run build -w packages/server

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/shared/dist /app/packages/shared/dist
COPY --from=builder /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=builder /app/packages/server/dist /app/packages/server/dist
COPY --from=builder /app/packages/server/package.json /app/packages/server/package.json
COPY --from=builder /app/packages/server/src /app/packages/server/src
COPY --from=builder /app/packages/server/tsconfig.json /app/packages/server/tsconfig.json
COPY --from=builder /app/tsconfig.json /app/tsconfig.json
ENV PORT=3000
EXPOSE 3000
COPY --from=builder /app/packages/server/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
CMD ["/app/entrypoint.sh"]
