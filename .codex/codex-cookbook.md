JudgeFinder Codex Cook Book

This cookbook explains how to build, extend and integrate with the JudgeFinder Platform (a public repository maintained by judgefinder.io) using [Next.js] and modern AI tools.  It summarizes the architecture, installation instructions, data‑sync routines and provides code‑generation templates to help you quickly create APIs, UI components and scripts using a GPT‑powered coding assistant such as Codex.

1 Overview of the JudgeFinder Platform
	•	Mission & data coverage – The platform provides AI‑powered judicial transparency by analyzing California courts and judges.  Its bias detection engine uses advanced AI models (Gemini 1.5 Flash and GPT‑4o) to evaluate 1 810 judges across 909 courts and more than 300 000 cases ￼.  Citizens and lawyers can search judges, compare them side‑by‑side and view analytics on decision times, reversal rates and other metrics ￼.
	•	Key features
	•	AI‑powered bias detection – Sophisticated analysis of judicial patterns using Gemini 1.5 Flash and GPT‑4o ￼.
	•	Comprehensive coverage – 1 810 judges, 909 courts and over 300 000 cases ￼.
	•	Judge comparison tool – Side‑by‑side comparison of up to three judges with metrics and analytics ￼.
	•	Advanced search – Multi‑filter search by jurisdiction, court type and specialization ￼.
	•	Real‑time updates – Automated daily and weekly synchronization from official sources ￼.
	•	Analytics dashboard – Detailed analytics including decision times, reversal rates and case distributions ￼.
	•	Tech stack – Built with Next.js 14 + TypeScript, Tailwind CSS, Supabase PostgreSQL, Clerk authentication, Upstash Redis (caching/rate limiting) and Vercel for hosting ￼.
 	•	AI & data integration – The platform fetches data from the CourtListener API and uses the Gemini and GPT‑4o models for analytics and fallback processing ￼.  Error monitoring is handled via Sentry ￼.

### Decision & Analytics Pipeline Enhancements (2025 Q1)
	•	Multi-year case ingestion – `DecisionSyncManager` now accepts a `yearsBack` option (default 5) and automatically deduplicates/updates historical decisions, so backfills can pull far more cases per judge without manual schema tweaks ￼.
	•	Automatic opinion hydration – Each freshly synced decision triggers a CourtListener opinion lookup and stores the resulting plain text in the `opinions` table, allowing analytics prompts to reference real judicial language instead of synthetic summaries ￼.
	•	Configurable document blending – The analytics API (`app/api/judges/[id]/analytics/route.ts`) merges statistical outcomes with AI summaries only when opinion text is available, increasing confidence scores while keeping transparency metrics consistent ￼.
	•	Backfill tip – For heavy imports, queue decision jobs with `{ yearsBack: 10, maxDecisionsPerJudge: 200 }` via the sync queue (see `SyncQueueManager`) or trigger a manual run with the new options to rapidly expand the analyzable corpus ￼.

### Bias Analysis UI & Baseline Metrics (2025 Q4)
	•	`<BiasPatternAnalysis>` now powers the judicial analytics page. It fetches `/api/judges/{id}/bias-analysis` with any active filter params and renders four tabs (case patterns, outcomes, temporal trends, indicators) with Recharts visualizations.
	•	Court baseline payloads (`metrics`, `sample_size`, `generated_at`) are optional. When present, the component shows a “Court average baseline” pill and highlights Δ values comparing the judge to the court-wide average.
	•	Sample-size guards live in `lib/analytics/config.ts`. Tune `NEXT_PUBLIC_MIN_SAMPLE_SIZE`, `NEXT_PUBLIC_GOOD_SAMPLE_SIZE`, and `NEXT_PUBLIC_HIDE_SAMPLE_BELOW_MIN` to control when metrics downgrade quality badges or disappear entirely.
	•	When fewer than `MIN_SAMPLE_SIZE` recent decisions are available, the UI surfaces a dashed warning banner and hides the corresponding chart until the next successful sync.
	•	QA checklist: hit the API directly for several judges to confirm the new payload shape, then walk the UI (toggle tab filters, switch data series, and verify the hidden-section copy) before shipping.

### Local Development & Testing
	•	Run `npm test` to execute the default quality gate (ESLint + `tsc --noEmit`). This replaces the previously missing test script and should pass before every commit.
	•	`npm run lint` and `npm run type-check` remain available when you want to run either stage independently.
	•	For analytics work, keep `.env.local` aligned with the sample-size env vars above so the UI warning behaviour matches production.

2 Project structure

The repository uses Next.js’s App Router.  Important directories include:
