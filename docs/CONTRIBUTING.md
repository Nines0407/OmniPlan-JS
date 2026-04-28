# Contributing

## Branch Strategy

- `main` — stable, production-ready
- `feat/xxx` — feature branches
- `fix/xxx` — bug fixes
- PRs squash-merge into `main`

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add bulk task update endpoint
fix: handle empty target stats correctly
docs: update API reference
refactor: extract ID generation to util
test: add integration tests for milestones
chore: update dependencies
```

## Pull Request Checklist

Before submitting a PR:

- [ ] Code compiles: `npm run typecheck`
- [ ] Lint passes: `npm run lint`
- [ ] All tests pass: `npm run test`
- [ ] Format checked: `npm run format:check`
- [ ] Related documentation updated (if API changes)
- [ ] No commented-out code or debugging artifacts

## Code Style

See `DEVELOPMENT_PLAN.md` Phase 7 for detailed conventions. Key points:

- **Files**: kebab-case (`task-service.ts`)
- **Components**: PascalCase (`TaskTable.tsx`)
- **Functions**: camelCase (`getTasksByWeek()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **DB tables**: snake_case plural (`task_dependencies`)
- **DB columns**: snake_case singular (`created_at`)

### Comments
- JSDoc for public functions and components
- Explain "why" not "what"
- No redundant comments for obvious code

## Project Structure

See `ARCHITECTURE.md` for the full architecture and extension points.
