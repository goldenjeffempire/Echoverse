// server/services/stripe.ts
import Stripe from 'stripe';
import type { Express, Request, Response } from 'express';
import { requireAuth } from '../auth';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Stripe Service Functions
export async function createPaymentIntent(amount: number, currency = 'usd', metadata = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
    });
    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    };
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
}

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
  } catch (error: any) {
    console.error('Error fetching Stripe prices:', error);
    throw new Error(`Failed to fetch Stripe prices: ${error.message}`);
  }
}

export async function getProductsWithPrices() {
  try {
    const products = await stripe.products.list({ active: true, limit: 10 });
    const prices = await stripe.prices.list({ active: true, limit: 100 });

    return products.data.map(product => {
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
  } catch (error: any) {
    console.error('Error fetching products with prices:', error);
    throw new Error(`Failed to fetch products with prices: ${error.message}`);
  }
}

export async function createCustomer(email: string, name: string, metadata = {}) {
  try {
    return await stripe.customers.create({ email, name, metadata });
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    throw new Error(`Failed to create Stripe customer: ${error.message}`);
  }
}

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

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer', 'items.data.price.product'],
    });
    const invoices = await stripe.invoices.list({ subscription: subscriptionId, limit: 5 });

    let lastFour = null;
    if (subscription.default_payment_method && typeof subscription.default_payment_method !== 'string') {
      if (subscription.default_payment_method.type === 'card') {
        lastFour = subscription.default_payment_method.card?.last4;
      }
    }

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start * 1000,
      currentPeriodEnd: subscription.current_period_end * 1000,
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
        date: invoice.created * 1000,
        pdf: invoice.invoice_pdf,
      })),
    };
  } catch (error: any) {
    console.error('Error retrieving subscription:', error);
    throw new Error(`Failed to retrieve subscription: ${error.message}`);
  }
}

// Stripe Route Handler Setup
export function setupStripeRoutes(app: Express) {
  app.post('/api/stripe/create-checkout-session', requireAuth, async (req: Request, res: Response) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        }],
        success_url: `${process.env.CLIENT_URL}/success`,
        cancel_url: `${process.env.CLIENT_URL}/cancel`,
        customer_email: req.user?.email,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error('Stripe session error:', err);
      res.status(500).json({ error: 'Stripe session creation failed' });
    }
  });
}

export default stripe;
