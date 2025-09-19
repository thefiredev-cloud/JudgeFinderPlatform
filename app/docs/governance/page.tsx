import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Governance, Ethics & Redress | JudgeFinder',
  description:
    'Read the governance principles, prohibited uses, and redress process that guide the JudgeFinder judicial transparency platform.',
  alternates: {
    canonical: '/docs/governance',
  },
}

const commitments = [
  {
    title: 'Bias mitigation',
    points: [
      'Independent review board evaluates all AI prompt updates and training data expansions before launch.',
      'Fairness probes compare outcomes against court-level baselines to flag metrics that drift by more than 12 percentage points.',
      'Human analysts audit LOW quality metrics weekly and remove any signal that cannot be traced back to verifiable documents.',
    ],
  },
  {
    title: 'Responsible disclosure',
    points: [
      'We publish methodology, advertising, and changelog updates within 24 hours of release.',
      'All corrections submitted through the report form receive an initial response inside the stated SLA.',
      'Security reports may be sent to security@judgefinder.io; we follow coordinated disclosure best practices.',
    ],
  },
  {
    title: 'Data retention & privacy',
    points: [
      'We store case metadata required for transparency. Sensitive filings marked sealed or confidential are excluded from analytics caches.',
      'We do not log end user search queries with identifiable Clerk or Supabase IDs. Aggregated analytics are stored for 30 days for capacity planning.',
      'Users may request deletion of bookmarked judges or saved filters via privacy@judgefinder.io. Requests are processed in under 7 days.',
    ],
  },
] as const

const prohibited = [
  'Do not use JudgeFinder to harass or intimidate judges, litigants, or attorneys.',
  'Do not market AI conclusions as legal advice; analytics are contextual signals only.',
  'Do not resell or repackage raw decision data without following the CourtListener bulk data license.',
  'Do not automate large scale scraping of authenticated areas; request partner API access instead.',
]

const redressSteps = [
  {
    label: 'Submit',
    text: 'Use the “Report data issue” link on any judge profile or email corrections@judgefinder.io with documentation.',
  },
  {
    label: 'Review',
    text: 'Ops team triages issues within one business day and tags them with status: new, researching, or resolved.',
  },
  {
    label: 'Respond',
    text: 'We send a written response (email or in-app notification) inside the 5 business day SLA with findings and actions taken.',
  },
]

export default function GovernancePage() {
  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <header className="mb-10 space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Accountability</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Governance, Ethics &amp; Redress</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Judicial transparency works only when the people impacted can see how decisions are made and challenge mistakes. These
            commitments govern how we run JudgeFinder, who can use the data, and how anyone can request a correction.
          </p>
        </header>

        <section className="space-y-8">
          {commitments.map(({ title, points }) => (
            <article key={title} className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              <ul className="mt-4 space-y-2 text-sm text-foreground/90 sm:text-base">
                {points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-xl font-semibold text-foreground">Prohibited uses</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            JudgeFinder content is licensed for civic transparency and responsible legal research. Using the platform in any of the
            ways below will result in access being revoked and, where required, referral to the appropriate authorities.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-foreground/90 sm:text-base">
            {prohibited.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-destructive" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Correction &amp; appeal process</h2>
          <ol className="mt-4 space-y-4 text-sm text-foreground/90 sm:text-base">
            {redressSteps.map(({ label, text }) => (
              <li key={label} className="rounded-xl border border-border/60 bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-2">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            If you believe a correction was mishandled, escalate to ethics@judgefinder.io. Appeals are reviewed by an external
            advisor with no product reporting line.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Want to understand the technical controls behind our metrics? Visit the{' '}
            <Link href="/docs/methodology" className="text-primary underline underline-offset-4">
              methodology guide
            </Link>{' '}
            or follow recent updates in the{' '}
            <Link href="/docs/changelog" className="text-primary underline underline-offset-4">
              public changelog
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
