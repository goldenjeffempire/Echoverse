import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Create a payment intent for a one-time payment
 * @param amount Amount in dollars (will be converted to cents)
 * @param currency Currency code (default: 'usd')
 * @param metadata Optional metadata
 * @returns Payment intent with client secret
 */
export async function createPaymentIntent(amount: number, currency = 'usd', metadata = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
}

/**
 * Retrieve available price plans
 * @returns List of price plans
 */
export async function getStripePrices() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 10,
    });

    return prices.data.map(price => ({
      id: price.id,
      productId: typeof price.product === 'string' ? price.product : price.product.id,
      productName: typeof price.product === 'string' ? '' : price.product.name,
      productDescription: typeof price.product === 'string' ? '' : price.product.description,
      unitAmount: price.unit_amount,
      currency: price.currency,
      interval: price.type === 'recurring' ? price.recurring?.interval : 'one-time',
      intervalCount: price.type === 'recurring' ? price.recurring?.interval_count : null,
    }));
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    throw new Error(`Failed to fetch Stripe prices: ${error.message}`);
  }
}

/**
 * Get all products with their associated prices
 * @returns List of products with their prices
 */
export async function getProductsWithPrices() {
  try {
    // Get all active products
    const products = await stripe.products.list({
      active: true,
      limit: 10,
    });
    
    // Get all active prices
    const prices = await stripe.prices.list({
      active: true,
      limit: 100, // Increased limit to catch all prices
    });
    
    // Map prices to their products
    const productsWithPrices = products.data.map(product => {
      const productPrices = prices.data
        .filter(price => price.product === product.id)
        .map(price => ({
          id: price.id,
          currency: price.currency,
          unitAmount: price.unit_amount,
          interval: price.type === 'recurring' ? price.recurring?.interval : 'one-time',
          intervalCount: price.type === 'recurring' ? price.recurring?.interval_count : null,
          nickname: price.nickname,
        }));
      
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: product.metadata,
        prices: productPrices,
      };
    });
    
    return productsWithPrices;
  } catch (error) {
    console.error('Error fetching products with prices:', error);
    throw new Error(`Failed to fetch products with prices: ${error.message}`);
  }
}

/**
 * Create a Stripe customer
 * @param email Customer email
 * @param name Customer name
 * @param metadata Optional metadata
 * @returns Stripe customer object
 */
export async function createCustomer(email: string, name: string, metadata = {}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error(`Failed to create Stripe customer: ${error.message}`);
  }
}

/**
 * Create a subscription for a customer
 * @param customerId Stripe customer ID
 * @param priceId Stripe price ID
 * @param metadata Optional metadata
 * @returns Subscription object with client secret for payment confirmation
 */
export async function createSubscription(customerId: string, priceId: string, metadata = {}) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata,
    });

    // Get the client secret from the subscription
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
}

/**
 * Cancel a subscription
 * @param subscriptionId Stripe subscription ID
 * @returns Canceled subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

/**
 * Get subscription details
 * @param subscriptionId Stripe subscription ID
 * @returns Subscription details with invoices and payment method
 */
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer', 'items.data.price.product'],
    });

    // Get invoices for this subscription
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit: 5,
    });

    // Get last 4 digits of the payment method if available
    let lastFour = null;
    if (subscription.default_payment_method && typeof subscription.default_payment_method !== 'string') {
      if (subscription.default_payment_method.type === 'card') {
        lastFour = subscription.default_payment_method.card?.last4;
      }
    }

    // Format subscription data
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start * 1000, // Convert to milliseconds
      currentPeriodEnd: subscription.current_period_end * 1000, // Convert to milliseconds
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planId: subscription.items.data[0].price.id,
      planName: typeof subscription.items.data[0].price.product === 'string' 
        ? 'Unknown' 
        : subscription.items.data[0].price.product.name,
      amount: subscription.items.data[0].price.unit_amount,
      currency: subscription.items.data[0].price.currency,
      interval: subscription.items.data[0].price.type === 'recurring' 
        ? subscription.items.data[0].price.recurring?.interval 
        : 'one-time',
      lastFour,
      invoices: invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        date: invoice.created * 1000, // Convert to milliseconds
        pdf: invoice.invoice_pdf,
      })),
    };
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw new Error(`Failed to retrieve subscription: ${error.message}`);
  }
}

export default stripe;