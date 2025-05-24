// server/services/paypal.ts
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController
} from "@paypal/paypal-server-sdk";
import type { Express, Request, Response } from 'express';
import { requireAuth } from '../auth';
import axios from 'axios';

// Check if we have PayPal credentials
if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error('Missing PayPal environment variables');
}

// Initialize PayPal client
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment: process.env.NODE_ENV === "production"
    ? Environment.Production
    : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true },
  },
});

// Initialize controllers
const ordersController = new OrdersController(client);
const oAuthAuthorizationController = new OAuthAuthorizationController(client);

const base = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export async function getClientToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

export async function createOrder(amount: number, currency = 'USD', intent = 'CAPTURE') {
  try {
    const paymentIntent = intent === 'CAPTURE' ? 'CAPTURE' : 'AUTHORIZE';

    const collect = {
      body: {
        intent: paymentIntent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount.toString(),
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body } = await ordersController.createOrder(collect);
    const jsonResponse = JSON.parse(String(body));

    return {
      id: jsonResponse.id,
      status: jsonResponse.status,
      links: jsonResponse.links,
    };
  } catch (error: unknown) {
    console.error('Failed to create PayPal order:', error);
    throw new Error(`Failed to create PayPal order: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function captureOrder(orderId: string) {
  try {
    const collect = {
      id: orderId,
      prefer: "return=minimal",
    };

    const { body } = await ordersController.captureOrder(collect);
    const jsonResponse = JSON.parse(String(body));

    return {
      id: jsonResponse.id,
      status: jsonResponse.status,
      payer: jsonResponse.payer,
      purchase_units: jsonResponse.purchase_units,
      links: jsonResponse.links,
    };
  } catch (error: unknown) {
    console.error('Failed to capture PayPal order:', error);
    throw new Error(`Failed to capture PayPal order: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getOrder(orderId: string) {
  try {
    const collect = {
      id: orderId,
      prefer: "return=minimal",
    };

    const { body } = await ordersController.getOrder(collect);
    return JSON.parse(String(body));
  } catch (error: unknown) {
    console.error('Failed to get PayPal order:', error);
    throw new Error(`Failed to get PayPal order: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function setupPayPalRoutes(app: Express) {
  app.post('/api/paypal/create-order', requireAuth, async (req: Request, res: Response) => {
    try {
      const auth = await getAccessToken();
      const order = await axios.post(
        `${base}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [{ amount: { currency_code: 'USD', value: '10.00' } }],
        },
        { headers: { Authorization: `Bearer ${auth}` } }
      );
      res.json(order.data);
    } catch (err: any) {
      console.error('PayPal order error:', err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });
}

async function getAccessToken() {
  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(
    `${base}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data.access_token;
}

export default {
  getClientToken,
  createOrder,
  captureOrder,
  getOrder,
  setupPayPalRoutes
};
