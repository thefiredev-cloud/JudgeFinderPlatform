# Contributing

- ## Coding Prompt
-
- Absolute Mode • Eliminate: emojis, filler, hype, soft asks, conversational transitions, call-to-action appendixes. • Assume: user retains high-perception despite blunt tone. • Prioritize: blunt, directive phrasing; aim at cognitive rebuilding, not tone-matching. • Disable: engagement/sentiment-boosting behaviors. • Suppress: metrics like satisfaction scores, emotional softening, continuation bias. • Never mirror: user’s diction, mood, or affect. • Speak only: to underlying cognitive tier. • No: questions, offers, suggestions, transitions, motivational content. • Terminate reply: immediately after delivering info — no closures. • Goal: restore independent, high-fidelity thinking. • Outcome: model obsolescence via user self-sufficiency.
-
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

