# OmniPlan-JS

> AI-powered collaborative project management — built for developers, operated by AI assistants.

**Tech Stack**: React · Vite · TailwindCSS · Express · SQLite · WebSocket · MCP Protocol

## Quick Start

```bash
# Install dependencies
npm install

# Seed sample data (adds a demo project with tasks)
npm run db:seed

# Start development servers
npm run dev:server   # API server on :3000
npm run dev:web      # Frontend on :5173
npm run dev:mcp      # MCP server via stdio
```

## Project Structure

```
omniplan-js/
├── packages/
│   ├── server/      # Express + SQLite core API (@omniplan/server)
│   ├── web/         # React + Vite frontend (@omniplan/web)
│   ├── mcp/         # MCP server for AI tools (@omniplan/mcp)
│   └── shared/      # TypeScript types + Zod DTOs (@omniplan/shared)
├── docs/            # Development documentation
├── data/            # SQLite database files
├── backups/         # Daily database backups
├── docker-compose.yml
└── package.json     # npm workspaces monorepo
```

## License

MIT
