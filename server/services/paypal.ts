import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController
} from "@paypal/paypal-server-sdk";

// Check if we have PayPal credentials
if (!process.env.PAYPAL_CLIENT_ID) {
  throw new Error('Missing PAYPAL_CLIENT_ID environment variable');
}
if (!process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error('Missing PAYPAL_CLIENT_SECRET environment variable');
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
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});

// Initialize controllers
const ordersController = new OrdersController(client);
const oAuthAuthorizationController = new OAuthAuthorizationController(client);

/**
 * Generate client token for PayPal SDK initialization
 * @returns Client token
 */
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

/**
 * Create a PayPal order
 * @param amount Order amount
 * @param currency Currency code (default: 'USD')
 * @param intent Order intent (default: 'CAPTURE')
 * @returns Created order
 */
export async function createOrder(amount: number, currency = 'USD', intent = 'CAPTURE') {
  try {
    // Create a type-safe intent value
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

    const { body, ...httpResponse } = await ordersController.createOrder(collect);
    const jsonResponse = JSON.parse(String(body));

    return {
      id: jsonResponse.id,
      status: jsonResponse.status,
      links: jsonResponse.links,
    };
  } catch (error: unknown) {
    console.error('Failed to create PayPal order:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create PayPal order: ${error.message}`);
    } else {
      throw new Error(`Failed to create PayPal order: ${String(error)}`);
    }
  }
}

/**
 * Capture a PayPal order (finalize payment)
 * @param orderId PayPal order ID
 * @returns Capture result
 */
export async function captureOrder(orderId: string) {
  try {
    const collect = {
      id: orderId,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.captureOrder(collect);
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
    if (error instanceof Error) {
      throw new Error(`Failed to capture PayPal order: ${error.message}`);
    } else {
      throw new Error(`Failed to capture PayPal order: ${String(error)}`);
    }
  }
}

/**
 * Get order details
 * @param orderId PayPal order ID
 * @returns Order details
 */
export async function getOrder(orderId: string) {
  try {
    const collect = {
      id: orderId,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.getOrder(collect);
    const jsonResponse = JSON.parse(String(body));

    return jsonResponse;
  } catch (error: unknown) {
    console.error('Failed to get PayPal order:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get PayPal order: ${error.message}`);
    } else {
      throw new Error(`Failed to get PayPal order: ${String(error)}`);
    }
  }
}

export default {
  getClientToken,
  createOrder,
  captureOrder,
  getOrder
};