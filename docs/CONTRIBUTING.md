# Contributing

## Development
- Use Node `20.x` locally (`.nvmrc` provided). Netlify builds on Node 18 per `netlify.toml`.
- Install deps: `npm install`
- Start dev: `npm run dev`
- Type check: `npm run type-check`
- Lint: `npm run lint`

## Code Style
- TypeScript for app and libs; Node scripts may be JS.
- Keep changes focused and minimal; prefer small PRs.
- Add comments to migrations and new SQL objects.

## Testing & Validation
- Validate environment locally (`.env.local`).
- Use `/api/health` and `/api/admin/sync-status` for smoke checks.
- For heavy sync tasks, reduce batch sizes while iterating.

## Docs
- Update `docs/` when adding features or changing APIs.
- If adding new env vars, extend `lib/utils/env-validator.ts` and docs/ENVIRONMENT.md.

