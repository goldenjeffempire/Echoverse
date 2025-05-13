import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { generateResponse } from "./services/openai";
import { 
  createPaymentIntent, 
  createCustomer, 
  createSubscription, 
  cancelSubscription, 
  getStripePrices,
  getSubscription,
  getProductsWithPrices
} from "./services/stripe";
import {
  getClientToken,
  createOrder,
  captureOrder,
  getOrder
} from "./services/paypal";
import { storage } from "./storage";

// Store active conversations
interface ConversationHistory {
  [connectionId: string]: string[];
}

const conversations: ConversationHistory = {};
const activeConnections = new Map<string, WebSocket>();

export async function registerRoutes(app: Express) {
  setupAuth(app);

  const httpServer = createServer(app);
  const wsServer = new WebSocketServer({ 
    noServer: true,
    clientTracking: true
  });

  wsServer.on('connection', (ws, request) => {
    const clientId = request.headers['sec-websocket-key'];
    if (!clientId) {
      ws.close();
      return;
    }

    console.log('Client connected');
    activeConnections.set(clientId, ws);
    conversations[clientId] = [];

    ws.on('message', async (message) => {
      try {
        const messageText = message.toString();
        if (!conversations[clientId]) {
          conversations[clientId] = [];
        }
        conversations[clientId].push(messageText);

        const aiResponse = await generateResponse(messageText, conversations[clientId]);

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'response',
            content: aiResponse
          }));
        }
      } catch (error: any) {
        console.error('Error processing message:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message || 'Failed to process request'
          }));
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1011, 'Internal server error');
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      activeConnections.delete(clientId);
      delete conversations[clientId];
    });

    ws.send('Connected to Echoverse AI Assistant');
  });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      if (!request.url) {
        socket.destroy();
        return;
      }

      const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

      if (pathname === '/ws') {
        if (socket.destroyed) return;

        wsServer.handleUpgrade(request, socket, head, (ws) => {
          if (!socket.destroyed) {
            wsServer.emit('connection', ws, request);
          }
        });
      } else {
        socket.destroy();
      }
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      if (!socket.destroyed) {
        socket.destroy();
      }
    }
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
  });

  // OpenAI API test endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await generateResponse(message);
      res.json({ response });
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      res.status(500).json({ error: 'Failed to generate response' });
    }
  });

  // Stripe payment endpoints
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'You must be logged in' });
      }

      const { amount } = req.body;
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const paymentIntent = await createPaymentIntent(parseFloat(amount));
      res.json({ clientSecret: paymentIntent.clientSecret, id: paymentIntent.id });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // Get available pricing plans
  app.get('/api/pricing-plans', async (req, res) => {
    try {
      const plans = await getStripePrices();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      res.status(500).json({ error: 'Failed to retrieve pricing plans' });
    }
  });

  // Get all products with their prices
  app.get('/api/products', async (req, res) => {
    try {
      const products = await getProductsWithPrices();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products with prices:', error);
      res.status(500).json({ error: 'Failed to retrieve products with prices' });
    }
  });

  // Create subscription
  app.post('/api/create-subscription', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'You must be logged in' });
      }

      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      const user = req.user;

      if (user.stripeSubscriptionId) {
        return res.status(400).json({ error: 'User already has an active subscription' });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await createCustomer(
          user.email || `${user.username}@example.com`,
          user.username
        );
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }

      const subscription = await createSubscription(customerId, priceId, {
        userId: user.id.toString()
      });

      await storage.updateUserStripeInfo(user.id, {
        customerId,
        subscriptionId: subscription.subscriptionId,
        planId: priceId,
        status: 'incomplete'
      });

      res.json({
        subscriptionId: subscription.subscriptionId,
        clientSecret: subscription.clientSecret
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'You must be logged in' });
      }

      const user = req.user;
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ error: 'No active subscription found' });
      }

      await cancelSubscription(user.stripeSubscriptionId);
      await storage.cancelSubscription(user.id);

      res.json({ success: true, message: 'Subscription canceled successfully' });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  // Get subscription details
  app.get('/api/subscription', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'You must be logged in' });
      }

      const user = req.user;
      if (!user.stripeSubscriptionId) {
        return res.status(404).json({ error: 'No subscription found' });
      }

      const subscription = await getSubscription(user.stripeSubscriptionId);
      res.json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ error: 'Failed to fetch subscription details' });
    }
  });

  // PayPal endpoints
  app.get('/api/paypal/client-token', async (req, res) => {
    try {
      const clientToken = await getClientToken();
      res.json({ clientToken });
    } catch (error) {
      console.error('Error generating PayPal client token:', error);
      res.status(500).json({ error: 'Failed to generate PayPal client token' });
    }
  });

  app.post('/api/paypal/create-order', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'You must be logged in' });
      }

      const { amount, currency = 'USD', intent = 'CAPTURE' } = req.body;

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const order = await createOrder(parseFloat(amount), currency, intent);
      res.json(order);
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      res.status(500).json({ error: 'Failed to create PayPal order' });
    }
  });

  app.post('/api/paypal/capture-order/:orderId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'You must be logged in' });
      }

      const { orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const captureResult = await captureOrder(orderId);
      res.json(captureResult);
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      res.status(500).json({ error: 'Failed to capture PayPal order' });
    }
  });

  app.get('/api/paypal/order/:orderId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'You must be logged in' });
      }

      const { orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const order = await getOrder(orderId);
      res.json(order);
    } catch (error) {
      console.error('Error fetching PayPal order:', error);
      res.status(500).json({ error: 'Failed to fetch PayPal order' });
    }
  });

  // AI Tutor endpoint
  app.post('/api/tutor', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required and must be a string' });
      }

      const response = await generateResponse(message);
      res.json({ response });
    } catch (error) {
      console.error('Tutor API Error:', error);
      res.status(500).json({ error: 'Failed to get tutor response' });
    }
  });

  // AI generation endpoint
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { prompt, type } = req.body;
      if (!prompt || !type) {
        return res.status(400).json({ error: 'Prompt and type are required' });
      }

      // Generate response using OpenAI service
      const response = await generateResponse(prompt);
      res.json({ response });
    } catch (error) {
      console.error('AI generation error:', error);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  });

  return httpServer;
}