FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/mcp/package.json packages/mcp/
RUN npm ci --workspaces --if-present
COPY packages/shared/src packages/shared/src
COPY tsconfig.json ./
COPY packages/shared/tsconfig.json packages/shared/tsup.config.ts packages/shared/
RUN npm run build -w packages/shared
COPY packages/mcp/src packages/mcp/src
COPY packages/mcp/tsconfig.json packages/mcp/
RUN npm run build -w packages/mcp

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/shared/dist /app/packages/shared/dist
COPY --from=builder /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=builder /app/packages/mcp/dist /app/packages/mcp/dist
COPY --from=builder /app/packages/mcp/package.json /app/packages/mcp/package.json
COPY --from=builder /app/packages/mcp/src /app/packages/mcp/src
COPY --from=builder /app/packages/mcp/tsconfig.json /app/packages/mcp/tsconfig.json
COPY --from=builder /app/tsconfig.json /app/tsconfig.json
ENV OMNIPLAN_API_URL=http://server:3000
EXPOSE 3100
CMD ["npx", "tsx", "packages/mcp/src/index.ts"]
