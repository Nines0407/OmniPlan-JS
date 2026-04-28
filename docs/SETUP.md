# Setup Guide

## Requirements

- Node.js >= 22
- npm >= 10

## Local Development

```bash
# Install dependencies
npm install

# Build shared package (required for other packages)
npm run build:shared

# Run database migrations & seed sample data
npm run db:seed

# Start all dev servers (run in separate terminals)
npm run dev:server   # API + WebSocket on :3000
npm run dev:web      # React frontend on :5173
npm run dev:mcp      # MCP server (stdio)
```

## Docker Deployment

```bash
# Build and start all services
docker compose up -d

# Services:
#   server  → http://localhost:3000
#   web     → http://localhost:80
#   mcp     → stdio only

# View logs
docker compose logs -f

# Stop
docker compose down
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server listen port |
| `NODE_ENV` | `development` | Environment mode |
| `OMNIPLAN_API_URL` | `http://localhost:3000` | Core API URL (for MCP) |
| `OMNIPLAN_API_KEY` | (empty) | API key for MCP auth |
| `VITE_API_URL` | (empty) | Frontend API base URL |

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev:server` | Start API server with hot reload |
| `npm run dev:web` | Start Vite dev server |
| `npm run dev:mcp` | Start MCP server |
| `npm run build` | Build all packages |
| `npm run test` | Run all tests (vitest) |
| `npm run lint` | Lint all source files |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:migrate` | Run pending database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run format` | Format code with Prettier |

## FAQ

**Q: How do I reset the database?**
```bash
rm data/omniplan.db && npm run db:seed
```

**Q: How do I add a new migration?**
Create a file at `packages/server/src/db/migrations/NNN_description.sql` and restart the server.

**Q: The frontend can't connect to the API?**
Make sure the server is running on port 3000. The Vite dev server proxies `/api` requests to `http://localhost:3000`.
