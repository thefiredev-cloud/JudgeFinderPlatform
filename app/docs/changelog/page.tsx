import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Product Changelog & Data Corrections | JudgeFinder',
  description:
    'Track JudgeFinder releases, schema changes, and data corrections. We publish every production change that affects analytics or public trust.',
  alternates: {
    canonical: '/docs/changelog',
  },
}

const releases = [
  {
    date: '2025-09-27',
    version: 'Trust Release v2025.09',
    highlights: [
      'Launched trust library with methodology, governance, advertising, and changelog documentation.',
      'Added metric provenance, denominators, and quality badges across judge analytics with LOW-quality escalation flow.',
      'Surface operational metrics (sync success, retries, cache hit ratio, p50/p95 latency) on the analytics dashboard.',
      'Introduced corrections intake API with rate limiting and admin workflow visibility.',
    ],
    corrections: [
      'Corrected duplicate criminal sentencing counts for Los Angeles Superior Court (impacted 18 judges).',
      'Normalized reversed appeals recorded as dismissals in August 2025 data imports.',
    ],
  },
  {
    date: '2025-08-24',
    version: 'Data Quality v2025.08',
    highlights: [
      'Stored canonical case source URLs on decision records.',
      'Expanded CourtListener assignment sync to cover historical positions.',
    ],
    corrections: [
      'Fixed San Diego Superior Court docket ingestion that skipped sealed cases (counts now exclude restricted filings).',
    ],
  },
] as const

export default function ChangelogPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <header className="mb-10 space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Release history</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Product changelog &amp; data corrections</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Every production deploy that affects analytics, data freshness, or trust messaging is logged here. We keep at least
            12 months of history so you can trace when methodology updates shipped and which data issues were resolved.
          </p>
        </header>

        <section className="space-y-8">
          {releases.map(({ date, version, highlights, corrections }) => (
            <article key={version} className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{version}</h2>
                  <p className="text-sm text-muted-foreground">Published {new Date(date).toLocaleDateString()}</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Production
                </span>
              </header>

              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Highlights</h3>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                    {highlights.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Data corrections</h3>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                    {corrections.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-destructive" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-xl font-semibold text-foreground">Correction service levels</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acknowledgement</dt>
              <dd className="mt-2 text-sm text-foreground">1 business day</dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Initial response</dt>
              <dd className="mt-2 text-sm text-foreground">5 business days</dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resolution target</dt>
              <dd className="mt-2 text-sm text-foreground">15 business days</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            Requests enter the queue through the corrections API or admin console. All status changes appear in the admin dashboard
            and the next published changelog entry.
          </p>
        </section>
      </div>
    </div>
  )
}
