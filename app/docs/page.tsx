import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transparency Docs | JudgeFinder',
  description: 'Explore methodology, governance, changelog, and advertising policies that power JudgeFinder transparency.',
  alternates: {
    canonical: '/docs',
  },
}

const docLinks = [
  {
    title: 'Methodology & data standards',
    description: 'Learn how we collect court data, normalize outcomes, and calculate confidence scores.',
    href: '/docs/methodology',
  },
  {
    title: 'Governance, ethics & redress',
    description: 'Review bias mitigation safeguards, prohibited uses, and how to request corrections.',
    href: '/docs/governance',
  },
  {
    title: 'Product changelog',
    description: 'Track releases, data corrections, and schema updates across the platform.',
    href: '/docs/changelog',
  },
  {
    title: 'Advertising policy',
    description: 'Understand how we verify sponsors, label ads, and keep analytics independent.',
    href: '/docs/ads-policy',
  },
]

export default function DocsIndexPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <header className="mb-10 space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Transparency center</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">JudgeFinder documentation</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Each guide explains how we source data, uphold governance standards, and communicate changes so that advocates,
            litigants, and journalists can trust the platform.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {docLinks.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="block rounded-2xl border border-border bg-card/90 p-6 shadow-sm transition-colors hover:border-[rgba(110,168,254,0.45)]"
            >
              <h2 className="text-xl font-semibold text-foreground">{doc.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{doc.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[color:hsl(var(--accent))]">
                Read guide →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
