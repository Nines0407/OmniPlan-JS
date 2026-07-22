FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci --workspaces --if-present
COPY packages/shared/src packages/shared/src
COPY tsconfig.json ./
COPY packages/shared/tsconfig.json packages/shared/tsup.config.ts packages/shared/
RUN npm run build -w packages/shared
COPY packages/web/src packages/web/src
COPY packages/web/index.html packages/web/
COPY packages/web/tsconfig.json packages/web/
COPY packages/web/vite.config.ts packages/web/
COPY packages/web/tailwind.config.js packages/web/
COPY packages/web/postcss.config.js packages/web/
RUN npm run build -w packages/web

FROM nginx:alpine
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
