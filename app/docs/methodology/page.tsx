import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Methodology & Data Standards | JudgeFinder',
  description:
    'Learn how JudgeFinder collects court records, normalizes outcomes, and generates confidence-scored analytics for California judges.',
  alternates: {
    canonical: '/docs/methodology',
  },
}

const sections = [
  {
    title: 'Data inputs',
    summary:
      'We combine public court dockets, published decisions, and structured CourtListener feeds to build daily datasets.',
    bullets: [
      'CourtListener API: decisions, dockets, judge assignments, and metadata refreshed twice daily.',
      'State and county portals: availability checks run nightly with automated retrievers for missing filings.',
      'Manual reconciliation: compliance team validates judge identity, courtroom, and assignment changes before publishing.',
    ],
  },
  {
    title: 'Normalization & deduplication',
    summary:
      'Court documents use inconsistent labels. We normalize party roles, case outcomes, and judge identifiers before analysis.',
    bullets: [
      'Party roles: plaintiff/defendant or petitioner/respondent mapped to civil or family categories with fallback heuristics.',
      'Outcome harmonization: raw text is classified into settle, dismiss, judgment, plea, or other buckets with rules that surface ambiguous language for review.',
      'Duplicate guardrails: docket numbers and filing timestamps are hashed to prevent double counting when multiple feeds overlap.',
    ],
  },
  {
    title: 'Confidence scoring',
    summary: 'Every metric includes a 60–95% confidence score based on sample size, document clarity, and model agreement.',
    bullets: [
      'Sample size weighting: scores degrade when n < 25 and hide below the public threshold (default 15).',
      'Document quality: OCR clarity, missing outcome text, or sealed filings reduce confidence in proportion to uncertainty.',
      'Model agreement: Gemini 1.5 Flash and GPT-4o-mini must agree within 6 percentage points or the fallback routine reruns with stricter prompts.',
    ],
  },
  {
    title: 'Limitations & safeguards',
    summary: 'AI analytics support transparency but do not replace legal advice.',
    bullets: [
      'Coverage gaps: counties with PDF-only archives may lag up to 14 days; these are labeled LOW quality until verified.',
      'Bias detection boundaries: we surface statistical tendencies only; we never label a judge as biased or make disciplinary claims.',
      'Human-in-the-loop: analysts review edge cases weekly, and all model prompts are version-controlled with regression tests.',
    ],
  },
] as const

export default function MethodologyPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <header className="mb-10 space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Transparency</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Methodology &amp; Data Standards</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            JudgeFinder summarizes public court activity to make judicial decision patterns easier to understand. This page
            explains how records flow into the platform, how we normalize outcomes, and what powers the confidence scores that
            appear on every metric.
          </p>
        </header>

        <section className="space-y-10">
          {sections.map(({ title, summary, bullets }) => (
            <article key={title} className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">{summary}</p>
              <ul className="mt-4 space-y-2 text-sm text-foreground/90 sm:text-base">
                {bullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-xl font-semibold text-foreground">Sampling thresholds</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Metrics are hidden on the public site when the sample size falls below the configured threshold (environment variable
            <code className="mx-1 rounded bg-card px-1 py-0.5 text-xs">NEXT_PUBLIC_MIN_SAMPLE_SIZE</code>, default 15). Scores between 15 and 30 show a LOW quality badge and direct
            users to request an update. All denominators display next to each chart so readers understand the evidence behind a
            percentage.
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Need more depth?</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            For details on governance, prohibited uses, or how we label advertisements, explore the rest of the trust library.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href="/docs/governance"
              className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Governance &amp; Ethics
            </Link>
            <Link
              href="/docs/ads-policy"
              className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Advertising policy
            </Link>
            <Link
              href="/docs/changelog"
              className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Release changelog
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
