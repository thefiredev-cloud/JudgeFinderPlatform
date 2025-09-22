import { resolveCourtSlug } from '@/lib/utils/slug'

export interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

export function generateJudgeBreadcrumbs(
  judgeName: string,
  jurisdiction: string,
  courtName: string,
  courtSlug?: string | null
): BreadcrumbItem[] {
  const jurisdictionSlug = jurisdiction.toLowerCase().replace(/\s+/g, '-')
  const preferredCourtSlug =
    courtSlug || resolveCourtSlug({ slug: courtSlug, name: courtName }) || 'unknown-court'

  return [
    { label: 'Judges', href: '/judges' },
    { label: jurisdiction, href: `/jurisdictions/${jurisdictionSlug}` },
    { label: courtName, href: `/courts/${preferredCourtSlug}` },
    { label: `Judge ${judgeName}`, href: '#', current: true },
  ]
}

export function generateCourtBreadcrumbs(
  courtName: string,
  jurisdiction: string,
  courtSlug?: string | null
): BreadcrumbItem[] {
  const jurisdictionSlug = jurisdiction.toLowerCase().replace(/\s+/g, '-')
  const preferredCourtSlug =
    courtSlug || resolveCourtSlug({ slug: courtSlug, name: courtName }) || 'unknown-court'

  return [
    { label: 'Courts', href: '/courts' },
    { label: jurisdiction, href: `/jurisdictions/${jurisdictionSlug}` },
    { label: courtName, href: `/courts/${preferredCourtSlug}`, current: true },
  ]
}


