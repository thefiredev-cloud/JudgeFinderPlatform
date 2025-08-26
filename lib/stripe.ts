import Stripe from 'stripe'

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
  typescript: true,
})

// Helper function to create a checkout session for ad spot subscriptions
export async function createAdSpotCheckoutSession({
  priceId,
  advertiserId,
  adSpotId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  priceId: string
  advertiserId: string
  adSpotId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      advertiser_id: advertiserId,
      ad_spot_id: adSpotId,
      ...metadata,
    },
    subscription_data: {
      metadata: {
        advertiser_id: advertiserId,
        ad_spot_id: adSpotId,
        ...metadata,
      },
    },
  })

  return session
}

// Helper function to create or retrieve a Stripe product for an ad spot
export async function getOrCreateAdSpotProduct({
  entityName,
  entityType,
  courtLevel,
}: {
  entityName: string
  entityType: 'judge' | 'court'
  courtLevel?: 'state' | 'federal'
}) {
  const productName = `Ad Spot - ${entityName}`
  const productDescription = entityType === 'judge' 
    ? `Monthly advertising spot on ${entityName}'s profile page${courtLevel ? ` (${courtLevel} court)` : ''}`
    : `Monthly advertising spot on ${entityName} page`

  // Search for existing product
  const existingProducts = await stripe.products.search({
    query: `name:"${productName}"`,
  })

  if (existingProducts.data.length > 0) {
    return existingProducts.data[0]
  }

  // Create new product
  const product = await stripe.products.create({
    name: productName,
    description: productDescription,
    metadata: {
      entity_type: entityType,
      entity_name: entityName,
      court_level: courtLevel || '',
    },
  })

  return product
}

// Helper function to create or retrieve a price for an ad spot
export async function getOrCreateAdSpotPrice({
  productId,
  monthlyAmount,
  currency = 'usd',
}: {
  productId: string
  monthlyAmount: number
  currency?: string
}) {
  // Check for existing price
  const existingPrices = await stripe.prices.list({
    product: productId,
    type: 'recurring',
    active: true,
  })

  const matchingPrice = existingPrices.data.find(
    price => price.unit_amount === monthlyAmount && price.currency === currency
  )

  if (matchingPrice) {
    return matchingPrice
  }

  // Create new price
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: monthlyAmount,
    currency,
    recurring: {
      interval: 'month',
    },
  })

  return price
}

// Helper function to cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

// Helper function to retrieve a subscription
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

// Helper function to create a customer portal session
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}