import 'dotenv/config'

import Stripe from 'stripe'

interface RecurringConfig {
  interval: 'month' | 'year'
}

interface PriceDefinition {
  lookupKey: string
  nickname: string
  unitAmountUsd: number
  recurring?: RecurringConfig
  metadata?: Record<string, string>
}

interface ProductDefinition {
  internalKey: string
  name: string
  description: string
  metadata: Record<string, string>
  statementDescriptor?: string
  prices: PriceDefinition[]
}

interface CatalogSummary {
  product: string
  createdPrices: string[]
  existingPrices: string[]
}

class StripeCatalogItem {
  private readonly stripe: Stripe
  private readonly definition: ProductDefinition

  public constructor(stripe: Stripe, definition: ProductDefinition) {
    this.stripe = stripe
    this.definition = definition
  }

  public async ensureProduct(): Promise<Stripe.Product> {
    const existing = await this.findProductByKey(this.definition.internalKey)

    if (existing) {
      return existing
    }

    return this.stripe.products.create({
      name: this.definition.name,
      description: this.definition.description,
      statement_descriptor: this.definition.statementDescriptor,
      metadata: {
        ...this.definition.metadata,
        internal_key: this.definition.internalKey,
      },
      tax_code: 'txcd_10000000',
      unit_label: 'placement',
      active: true,
      type: 'service',
    })
  }

  public async ensurePrices(productId: string): Promise<CatalogSummary> {
    const summary: CatalogSummary = {
      product: this.definition.internalKey,
      createdPrices: [],
      existingPrices: [],
    }

    for (const priceDef of this.definition.prices) {
      const existing = await this.findPriceByLookupKey(priceDef.lookupKey)

      if (existing) {
        summary.existingPrices.push(priceDef.lookupKey)
        continue
      }

      await this.stripe.prices.create({
        lookup_key: priceDef.lookupKey,
        nickname: priceDef.nickname,
        product: productId,
        currency: 'usd',
        unit_amount: Math.round(priceDef.unitAmountUsd * 100),
        recurring: priceDef.recurring
          ? {
              interval: priceDef.recurring.interval,
            }
          : undefined,
        metadata: priceDef.metadata,
        billing_scheme: 'per_unit',
        tax_behavior: 'exclusive',
      })

      summary.createdPrices.push(priceDef.lookupKey)
    }

    return summary
  }

  private async findProductByKey(key: string): Promise<Stripe.Product | null> {
    try {
      const result = await this.stripe.products.search({
        query: `metadata['internal_key']:'${key}' AND active:'true'`,
        limit: 1,
      })

      return result.data.at(0) ?? null
    } catch (error) {
      console.warn(`Stripe product search failed for ${key}:`, error)
      return null
    }
  }

  private async findPriceByLookupKey(lookupKey: string): Promise<Stripe.Price | null> {
    try {
      const result = await this.stripe.prices.search({
        query: `lookup_key:'${lookupKey}' AND active:'true'`,
        limit: 1,
      })

      return result.data.at(0) ?? null
    } catch (error) {
      console.warn(`Stripe price search failed for ${lookupKey}:`, error)
      return null
    }
  }
}

class StripePaymentConfigurationManager {
  private readonly stripe: Stripe

  public constructor(stripe: Stripe) {
    this.stripe = stripe
  }

  public async ensurePaymentConfiguration(): Promise<void> {
    console.info(
      'Review Stripe payment method configuration to enable ACH debit if required. Automating this step is not supported via API.'
    )
  }
}

class StripePortalConfigurationManager {
  private readonly stripe: Stripe
  private readonly metadataKey = 'judgefinder_portal_default'

  public constructor(stripe: Stripe) {
    this.stripe = stripe
  }

  public async ensurePortalConfiguration(): Promise<void> {
    try {
      const configurations = await this.stripe.billingPortal.configurations.list({ limit: 20 })
      const existing = configurations.data.find((config) => config.metadata?.internal_key === this.metadataKey)

      if (existing) {
        return
      }

      const returnUrl = process.env.STRIPE_PORTAL_RETURN_URL || 'https://judgefinder.io/dashboard/advertiser'

      await this.stripe.billingPortal.configurations.create({
        business_profile: {
          headline: 'JudgeFinder Sponsor Portal',
          privacy_policy_url: 'https://judgefinder.io/privacy',
          terms_of_service_url: 'https://judgefinder.io/terms',
        },
        features: {
          customer_update: {
            enabled: true,
            allowed_updates: ['email', 'phone']
          },
          invoice_history: { enabled: true },
          payment_method_update: { enabled: true },
          subscription_cancel: { enabled: true },
          subscription_pause: { enabled: false },
        },
        metadata: { internal_key: this.metadataKey },
        default_return_url: returnUrl,
      })

      console.info('Created Stripe billing portal configuration.')
    } catch (error) {
      console.warn('Unable to ensure Stripe billing portal configuration automatically. Configure manually if needed.', error)
    }
  }
}

class StripeCatalogSyncService {
  private readonly stripe: Stripe
  private readonly catalog: StripeCatalogItem[]

  public constructor(stripe: Stripe, definitions: ProductDefinition[]) {
    this.stripe = stripe
    this.catalog = definitions.map((definition) => new StripeCatalogItem(stripe, definition))
  }

  public async sync(): Promise<CatalogSummary[]> {
    const summaries: CatalogSummary[] = []

    for (const item of this.catalog) {
      const product = await item.ensureProduct()
      const summary = await item.ensurePrices(product.id)
      summaries.push(summary)
    }

    return summaries
  }
}

const VERIFIED_LISTING_DESCRIPTION = 'Paid, bar-verified sponsor placement on a JudgeFinder profile. Inventory limited to one slot with up to two rotating attorneys by policy.'

const CATALOG_DEFINITIONS: ProductDefinition[] = [
  {
    internalKey: 'verified_listing_tier_a',
    name: 'Verified Listing — Tier A',
    description: VERIFIED_LISTING_DESCRIPTION,
    metadata: { tier: 'A', placement: 'judge_profile', category: 'listing' },
    prices: [
      {
        lookupKey: 'verified_listing_tier_a_monthly',
        nickname: 'Tier A Monthly',
        unitAmountUsd: 449,
        recurring: { interval: 'month' },
        metadata: { billing_cycle: 'monthly' },
      },
      {
        lookupKey: 'verified_listing_tier_a_annual',
        nickname: 'Tier A Annual (10x)',
        unitAmountUsd: 4490,
        recurring: { interval: 'year' },
        metadata: { billing_cycle: 'annual', discount_policy: '10x_monthly' },
      },
    ],
  },
  {
    internalKey: 'verified_listing_tier_b',
    name: 'Verified Listing — Tier B',
    description: VERIFIED_LISTING_DESCRIPTION,
    metadata: { tier: 'B', placement: 'judge_profile', category: 'listing' },
    prices: [
      {
        lookupKey: 'verified_listing_tier_b_monthly',
        nickname: 'Tier B Monthly',
        unitAmountUsd: 299,
        recurring: { interval: 'month' },
        metadata: { billing_cycle: 'monthly' },
      },
      {
        lookupKey: 'verified_listing_tier_b_annual',
        nickname: 'Tier B Annual (10x)',
        unitAmountUsd: 2990,
        recurring: { interval: 'year' },
        metadata: { billing_cycle: 'annual', discount_policy: '10x_monthly' },
      },
    ],
  },
  {
    internalKey: 'verified_listing_tier_c',
    name: 'Verified Listing — Tier C',
    description: VERIFIED_LISTING_DESCRIPTION,
    metadata: { tier: 'C', placement: 'judge_profile', category: 'listing' },
    prices: [
      {
        lookupKey: 'verified_listing_tier_c_monthly',
        nickname: 'Tier C Monthly',
        unitAmountUsd: 199,
        recurring: { interval: 'month' },
        metadata: { billing_cycle: 'monthly' },
      },
      {
        lookupKey: 'verified_listing_tier_c_annual',
        nickname: 'Tier C Annual (10x)',
        unitAmountUsd: 1990,
        recurring: { interval: 'year' },
        metadata: { billing_cycle: 'annual', discount_policy: '10x_monthly' },
      },
    ],
  },
  {
    internalKey: 'verified_listing_tier_d',
    name: 'Verified Listing — Tier D',
    description: VERIFIED_LISTING_DESCRIPTION,
    metadata: { tier: 'D', placement: 'judge_profile', category: 'listing' },
    prices: [
      {
        lookupKey: 'verified_listing_tier_d_monthly',
        nickname: 'Tier D Monthly',
        unitAmountUsd: 119,
        recurring: { interval: 'month' },
        metadata: { billing_cycle: 'monthly' },
      },
      {
        lookupKey: 'verified_listing_tier_d_annual',
        nickname: 'Tier D Annual (10x)',
        unitAmountUsd: 1190,
        recurring: { interval: 'year' },
        metadata: { billing_cycle: 'annual', discount_policy: '10x_monthly' },
      },
    ],
  },
  {
    internalKey: 'verified_listing_exclusive_tier_a',
    name: 'Exclusive Rotation — Tier A',
    description: 'Upgrade to exclusive placement on Tier A judge pages (both rotations).',
    metadata: { tier: 'A', placement: 'judge_profile', category: 'exclusive_addon', multiplier: '1.75' },
    prices: [
      {
        lookupKey: 'verified_listing_exclusive_tier_a_monthly',
        nickname: 'Exclusive Tier A Monthly',
        unitAmountUsd: 786,
        recurring: { interval: 'month' },
      },
      {
        lookupKey: 'verified_listing_exclusive_tier_a_annual',
        nickname: 'Exclusive Tier A Annual (10x)',
        unitAmountUsd: 7860,
        recurring: { interval: 'year' },
      },
    ],
  },
  {
    internalKey: 'verified_listing_exclusive_tier_b',
    name: 'Exclusive Rotation — Tier B',
    description: 'Upgrade to exclusive placement on Tier B judge pages (both rotations).',
    metadata: { tier: 'B', placement: 'judge_profile', category: 'exclusive_addon', multiplier: '1.75' },
    prices: [
      {
        lookupKey: 'verified_listing_exclusive_tier_b_monthly',
        nickname: 'Exclusive Tier B Monthly',
        unitAmountUsd: 523.25,
        recurring: { interval: 'month' },
      },
      {
        lookupKey: 'verified_listing_exclusive_tier_b_annual',
        nickname: 'Exclusive Tier B Annual (10x)',
        unitAmountUsd: 5232.5,
        recurring: { interval: 'year' },
      },
    ],
  },
  {
    internalKey: 'verified_listing_exclusive_tier_c',
    name: 'Exclusive Rotation — Tier C',
    description: 'Upgrade to exclusive placement on Tier C judge pages (both rotations).',
    metadata: { tier: 'C', placement: 'judge_profile', category: 'exclusive_addon', multiplier: '1.75' },
    prices: [
      {
        lookupKey: 'verified_listing_exclusive_tier_c_monthly',
        nickname: 'Exclusive Tier C Monthly',
        unitAmountUsd: 348.25,
        recurring: { interval: 'month' },
      },
      {
        lookupKey: 'verified_listing_exclusive_tier_c_annual',
        nickname: 'Exclusive Tier C Annual (10x)',
        unitAmountUsd: 3482.5,
        recurring: { interval: 'year' },
      },
    ],
  },
  {
    internalKey: 'verified_listing_exclusive_tier_d',
    name: 'Exclusive Rotation — Tier D',
    description: 'Upgrade to exclusive placement on Tier D judge pages (both rotations).',
    metadata: { tier: 'D', placement: 'judge_profile', category: 'exclusive_addon', multiplier: '1.75' },
    prices: [
      {
        lookupKey: 'verified_listing_exclusive_tier_d_monthly',
        nickname: 'Exclusive Tier D Monthly',
        unitAmountUsd: 208.25,
        recurring: { interval: 'month' },
      },
      {
        lookupKey: 'verified_listing_exclusive_tier_d_annual',
        nickname: 'Exclusive Tier D Annual (10x)',
        unitAmountUsd: 2082.5,
        recurring: { interval: 'year' },
      },
    ],
  },
  {
    internalKey: 'search_tile_packages',
    name: 'Sponsored Search Tiles',
    description: 'Featured attorney placements that appear after organic search results.',
    metadata: { placement: 'search_results', category: 'tile' },
    prices: [
      {
        lookupKey: 'search_tile_starter_monthly',
        nickname: 'Search Tile Starter Monthly',
        unitAmountUsd: 500,
        recurring: { interval: 'month' },
        metadata: { package: 'starter' },
      },
      {
        lookupKey: 'search_tile_pro_monthly',
        nickname: 'Search Tile Pro Monthly',
        unitAmountUsd: 1000,
        recurring: { interval: 'month' },
        metadata: { package: 'pro' },
      },
      {
        lookupKey: 'search_tile_max_monthly',
        nickname: 'Search Tile Max Monthly',
        unitAmountUsd: 2500,
        recurring: { interval: 'month' },
        metadata: { package: 'max' },
      },
    ],
  },
  {
    internalKey: 'email_digest_sponsorship',
    name: 'Email Digest Sponsorship',
    description: 'Sponsorship inventory for jurisdiction-specific judicial email digests.',
    metadata: { channel: 'email', category: 'sponsorship' },
    prices: [
      {
        lookupKey: 'email_digest_county',
        nickname: 'County Email Digest (Per Send)',
        unitAmountUsd: 300,
        metadata: { scope: 'county', billing_model: 'per_send' },
      },
      {
        lookupKey: 'email_digest_metro',
        nickname: 'Metro Email Digest (Per Send)',
        unitAmountUsd: 600,
        metadata: { scope: 'metro', billing_model: 'per_send' },
      },
      {
        lookupKey: 'email_digest_statewide',
        nickname: 'Statewide Email Digest (Per Send)',
        unitAmountUsd: 1200,
        metadata: { scope: 'statewide', billing_model: 'per_send' },
      },
    ],
  },
  {
    internalKey: 'research_exports',
    name: 'Aggregated Research Exports',
    description: 'Aggregated, policy-compliant analytics exports for courts or counties.',
    metadata: { channel: 'analytics_export', category: 'data' },
    prices: [
      {
        lookupKey: 'research_export_county',
        nickname: 'County-Level Export (One-time)',
        unitAmountUsd: 99,
        metadata: { scope: 'county' },
      },
      {
        lookupKey: 'research_export_statewide',
        nickname: 'Statewide Export (One-time)',
        unitAmountUsd: 499,
        metadata: { scope: 'statewide' },
      },
    ],
  },
  {
    internalKey: 'alerts_pro_tools',
    name: 'Alerts & Pro Tools',
    description: 'Unlock premium monitoring tools, alerts, and analytics workspaces.',
    metadata: { channel: 'pro_tools', category: 'subscription' },
    prices: [
      {
        lookupKey: 'alerts_pro_solo_monthly',
        nickname: 'Alerts & Tools — Solo Monthly',
        unitAmountUsd: 29,
        recurring: { interval: 'month' },
        metadata: { seat_count: '1' },
      },
      {
        lookupKey: 'alerts_pro_firm_monthly',
        nickname: 'Alerts & Tools — Firm Monthly',
        unitAmountUsd: 99,
        recurring: { interval: 'month' },
        metadata: { seat_count: '5' },
      },
    ],
  },
]

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey || !secretKey.startsWith('sk_')) {
    console.error('Missing STRIPE_SECRET_KEY environment variable. Aborting catalog sync.')
    process.exit(1)
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2023-10-16',
    appInfo: { name: 'JudgeFinder Catalog Sync' },
  })

  const syncService = new StripeCatalogSyncService(stripe, CATALOG_DEFINITIONS)
  const summaries = await syncService.sync()

  const paymentConfigManager = new StripePaymentConfigurationManager(stripe)
  await paymentConfigManager.ensurePaymentConfiguration()

  const portalManager = new StripePortalConfigurationManager(stripe)
  await portalManager.ensurePortalConfiguration()

  console.table(
    summaries.map((summary) => ({
      product: summary.product,
      created: summary.createdPrices.join(', ') || '—',
      existing: summary.existingPrices.join(', ') || '—',
    }))
  )

  console.info('Stripe catalog sync completed.')
}

void main()
