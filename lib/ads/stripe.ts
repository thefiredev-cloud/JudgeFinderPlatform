import 'server-only'

import Stripe from 'stripe'
import { logger } from '@/lib/utils/logger'
import type { AdvertiserProfile } from '@/types/advertising'

let stripeClient: Stripe | null = null

export function isStripeEnabled(): boolean {
  const secret = process.env.STRIPE_SECRET_KEY
  return Boolean(secret && secret.startsWith('sk_'))
}

export function getStripeClient(): Stripe | null {
  if (!isStripeEnabled()) {
    return null
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2023-10-16',
      appInfo: {
        name: 'JudgeFinder',
      },
    })
  }

  return stripeClient
}

export async function ensureStripeCustomer(profile: AdvertiserProfile): Promise<string | null> {
  const stripe = getStripeClient()
  if (!stripe) {
    logger.info('Stripe not configured; skipping customer sync', { advertiserId: profile.id })
    return null
  }

  if (profile.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  try {
    const customer = await stripe.customers.create({
      email: profile.billing_email || profile.contact_email,
      name: profile.firm_name,
      metadata: {
        advertiser_id: profile.id,
        account_status: profile.account_status,
      },
    })

    return customer.id
  } catch (error) {
    logger.error('Failed to create Stripe customer', { advertiserId: profile.id, error })
    return null
  }
}
