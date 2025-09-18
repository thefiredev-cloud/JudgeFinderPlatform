# Commands & APIs

## npm Scripts
```
# Dev & quality
npm run dev                     # Start Next.js dev server
npm run type-check              # TypeScript
npm run lint                    # ESLint
npm run build                   # Production build

# Data sync
npm run sync:courts             # Manual courts sync
npm run sync:judges             # Manual judges sync
npm run sync:decisions          # Manual decisions sync

# Analytics
npm run analytics:generate      # Batch AI analytics generation
npm run bias:analyze            # Bias analysis

# Automation / cron
npm run cron:daily              # Manual daily sync flow
npm run cron:weekly             # Manual weekly sync flow
npm run assignments:update      # Automated assignment updater

# Launch helpers
npm run launch:data             # Courts + judges
npm run launch:analytics        # All analytics
npm run launch:validate         # Relationship + integrity checks
```

## Key Node Scripts
- `scripts/automated-assignment-updater.js`
- `scripts/batch-generate-analytics.js`
- `scripts/comprehensive-validation.js`
- `scripts/sync-*.js` (manual entry points)

## API Endpoints
- `GET /api/health` – system health
- `GET /api/admin/sync-status` – status/metrics
- `POST /api/admin/sync-status` – queue/control (header: `x-api-key: ${SYNC_API_KEY}`)
- `GET /api/admin/stats` – gated via Clerk admin

Examples:
```
curl -s https://<site>/api/health | jq
curl -s -H "x-api-key: $SYNC_API_KEY" https://<site>/api/admin/sync-status | jq
```

