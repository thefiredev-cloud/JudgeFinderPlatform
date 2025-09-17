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

2 Project structure

The repository uses Next.js’s App Router.  Important directories include:
