import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Advertising & Verified Listings Policy | JudgeFinder',
  description:
    'Understand how JudgeFinder labels advertisements, verifies attorney sponsors, and keeps promotional content separate from analytics.',
  alternates: {
    canonical: '/docs/ads-policy',
  },
}

const labeling = [
  'Every paid placement carries a visible “Ad” badge, aria-label, and tooltip clarifying the relationship.',
  'Sponsor cards include the attorney’s California State Bar profile link for verification.',
  'Ads never alter or reorder analytics. They appear only in designated sponsor blocks.',
]

const placementRules = [
  'Judge profile pages: one sponsor slot beneath “Verified Legal Professionals” with a maximum of two rotating attorneys.',
  'Search results: promotional tiles render after organic judge results, never before them.',
  'Email digests: ads are clearly separated, with unsubscribe instructions and bar verification links.',
]

const restrictions = [
  'No political campaigns, fundraising, or content that undermines judicial independence.',
  'No vendors promising case outcomes or implying affiliation with a specific judge.',
  'No ads that conflict with California Rules of Professional Conduct or fail bar verification checks.',
]

export default function AdsPolicyPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <header className="mb-10 space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Advertising standards</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Advertising &amp; Verified Listings Policy</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Sponsored content helps fund the JudgeFinder transparency mission. To protect readers, every ad follows strict
            labeling, verification, and placement rules.
          </p>
        </header>

        <section className="space-y-8">
          <article className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">How ads are labeled</h2>
            <ul className="mt-4 space-y-3 text-sm text-foreground/90 sm:text-base">
              {labeling.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">Placement rules</h2>
            <ul className="mt-4 space-y-3 text-sm text-foreground/90 sm:text-base">
              {placementRules.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">Restricted content</h2>
            <ul className="mt-4 space-y-3 text-sm text-foreground/90 sm:text-base">
              {restrictions.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-destructive" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-xl font-semibold text-foreground">Reporting concerns</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            If you see an unlabeled or misleading advertisement, email ads@judgefinder.io with screenshots. We investigate every
            report within 2 business days. Violations lead to removal and, when needed, disclosure to the State Bar of California.
          </p>
        </section>
      </div>
    </div>
  )
}
