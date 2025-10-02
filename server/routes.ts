import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  authenticateToken, 
  optionalAuth, 
  requireRole,
  refreshTokens,
  type AuthenticatedRequest 
} from "./auth";
import {
  generateWebsiteContent,
  generateBlogPost,
  generateMarketingContent,
  optimizeForSEO,
  generateChatbotResponse,
  analyzeContent,
  generateCompleteWebsite,
  generateWebComponent,
  generateWebsiteTemplate,
  enhanceWebsiteContent
} from "./ai";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", authenticateToken, logout);
  app.post("/api/auth/refresh", refreshTokens);
  app.get("/api/auth/me", authenticateToken, getCurrentUser);

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user!.id,
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Subscription endpoint
  app.post('/api/get-or-create-subscription', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const user = req.user!;

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        try {
          res.send({
            subscriptionId: subscription.id,
            status: subscription.status,
          });
        } catch (error) {
          console.error('Error retrieving subscription:', error);
          res.status(500).json({ message: 'Error retrieving subscription details' });
          return;
        }
        return;
      } catch (error) {
        console.error('Error retrieving subscription:', error);
      }
    }
    
    if (!user.email) {
      res.status(400).json({ message: 'User email is required for subscriptions' });
      return;
    }

    try {
      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: user.id,
          },
        });
        await storage.updateStripeCustomerId(user.id, customer.id);
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // Set STRIPE_PRICE_ID in environment
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, {
        customerId: customer.id, 
        subscriptionId: subscription.id
      });
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Stripe webhook handler
  app.post('/api/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        // Update user subscription status in database
        console.log('Subscription updated:', subscription.id);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // AI Content Generation Endpoints
  app.post("/api/ai/generate-website", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt, type = 'landing' } = req.body;
      const content = await generateWebsiteContent(prompt, type);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/generate-blog", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { topic, tone = 'professional', length = 'medium' } = req.body;
      const content = await generateBlogPost(topic, tone, length);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/generate-marketing", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { campaign, type } = req.body;
      const content = await generateMarketingContent(campaign, type);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/optimize-seo", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { content, keywords } = req.body;
      const optimized = await optimizeForSEO(content, keywords);
      res.json(optimized);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/chatbot", async (req, res) => {
    try {
      const { message, context = '' } = req.body;
      const response = await generateChatbotResponse(message, context);
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/analyze-content", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { content } = req.body;
      const analysis = await analyzeContent(content);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI Website Builder - Complete Website Generation
  app.post("/api/ai/generate-complete-website", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { description, businessType, style = 'modern', pages = ['home', 'about', 'contact'], colorScheme, features } = req.body;
      
      if (!description || !businessType) {
        res.status(400).json({ message: "Description and business type are required" });
        return;
      }
      
      const website = await generateCompleteWebsite({
        description,
        businessType,
        style,
        pages,
        colorScheme,
        features
      });
      
      res.json({ website });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/generate-component", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { type, description, style = 'modern', content } = req.body;
      
      if (!type || !description) {
        res.status(400).json({ message: "Component type and description are required" });
        return;
      }
      
      const component = await generateWebComponent({
        type,
        description,
        style,
        content
      });
      
      res.json({ component });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/generate-template", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { industry, style = 'modern', features = [] } = req.body;
      
      if (!industry) {
        res.status(400).json({ message: "Industry is required" });
        return;
      }
      
      const template = await generateWebsiteTemplate({
        industry,
        style,
        features
      });
      
      res.json({ template });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/enhance-content", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { content, enhancement = 'readability', target = 'general audience' } = req.body;
      
      if (!content) {
        res.status(400).json({ message: "Content is required" });
        return;
      }
      
      const enhanced = await enhanceWebsiteContent({
        content,
        enhancement,
        target
      });
      
      res.json(enhanced);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // RBAC Protected Routes
  app.get("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
    // Get all users (admin only)
    try {
      const users = await storage.getAllUsers();
      res.json({ users: users.map(u => ({ ...u, password: undefined })) });
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  app.delete("/api/admin/users/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
    // Delete user (admin only)
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });
  
  app.put("/api/admin/users/:id/role", authenticateToken, requireRole(["admin"]), async (req, res) => {
    // Update user role (admin only)
    try {
      const { role } = req.body;
      if (!['user', 'admin', 'moderator'].includes(role)) {
        res.status(400).json({ message: "Invalid role" });
        return;
      }
      const user = await storage.updateUser(req.params.id, { role });
      res.json({ user: user ? { ...user, password: undefined } : null });
    } catch (error) {
      res.status(500).json({ message: "Error updating user role" });
    }
  });
  
  // Moderator routes
  app.get("/api/moderate/content", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
    res.json({ message: "Content moderation access granted" });
  });
  
  // Pro subscription required routes
  app.post("/api/ai/advanced-generation", authenticateToken, async (req: AuthenticatedRequest, res) => {
    if (!['pro', 'enterprise'].includes(req.user!.subscriptionTier || 'free')) {
      res.status(403).json({ message: "Pro subscription required" });
      return;
    }
    // Advanced AI generation logic here
    res.json({ message: "Advanced AI generation available" });
  });

  // E-Commerce Product Management
  app.get("/api/products", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { category, search, limit = 20, offset = 0 } = req.query;
      const products = await storage.getProducts({
        category: category as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json({ products });
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.json({ product });
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.post("/api/products", authenticateToken, requireRole(["admin", "moderator"]), async (req: AuthenticatedRequest, res) => {
    try {
      const productData = req.body;
      const product = await storage.createProduct({
        ...productData,
        userId: req.user!.id
      });
      res.status(201).json({ product });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating product: ${error.message}` });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      
      // Check ownership or admin role
      if (product.userId !== req.user!.id && !['admin', 'moderator'].includes(req.user!.role)) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      
      const updatedProduct = await storage.updateProduct(req.params.id, req.body);
      res.json({ product: updatedProduct });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating product: ${error.message}` });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      
      // Check ownership or admin role
      if (product.userId !== req.user!.id && !['admin', 'moderator'].includes(req.user!.role)) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      
      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // E-Commerce Order Management
  app.get("/api/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, limit = 20, offset = 0 } = req.query;
      const orders = await storage.getOrders(req.user!.id, {
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json({ orders });
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      
      // Check ownership or admin role
      if (order.userId !== req.user!.id && !['admin', 'moderator'].includes(req.user!.role)) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      
      res.json({ order });
    } catch (error) {
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { items, shippingAddress, paymentMethodId } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: "Order items are required" });
        return;
      }
      
      // Calculate total and create Stripe payment intent
      let totalAmount = 0;
      const orderItems = [];
      
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          res.status(400).json({ message: `Product not found: ${item.productId}` });
          return;
        }
        
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          total: itemTotal
        });
      }
      
      // Get user email
      const userEmail = req.user!.email || 'user@example.com';
      
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: "usd",
        payment_method: paymentMethodId,
        confirm: true,
        return_url: `${process.env.REPLIT_DEV_DOMAIN}/orders`,
        metadata: {
          userId: req.user!.id,
        },
      });
      
      // Create order in database
      const order = await storage.createOrder({
        userId: req.user!.id,
        customerEmail: userEmail,
        items: orderItems,
        total: totalAmount,
        shippingAddress,
        stripePaymentIntentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'confirmed' : 'pending'
      });
      
      res.status(201).json({ 
        order, 
        clientSecret: paymentIntent.client_secret 
      });
    } catch (error: any) {
      console.error('Order creation error:', error);
      res.status(400).json({ message: `Error creating order: ${error.message}` });
    }
  });

  app.put("/api/orders/:id/status", authenticateToken, requireRole(["admin", "moderator"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        res.status(400).json({ message: "Invalid order status" });
        return;
      }
      
      const order = await storage.updateOrderStatus(req.params.id, status);
      res.json({ order });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating order: ${error.message}` });
    }
  });

  // E-Commerce Product Management
  app.get("/api/products", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { category, search, limit = 20, offset = 0 } = req.query;
      const products = await storage.getProducts({
        category: category as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json({ products });
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.json({ product });
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.post("/api/products", authenticateToken, requireRole(["admin", "moderator"]), async (req: AuthenticatedRequest, res) => {
    try {
      const productData = req.body;
      const product = await storage.createProduct({
        ...productData,
        ownerId: req.user!.id
      });
      res.status(201).json({ product });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating product: ${error.message}` });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      
      // Check ownership or admin role
      if (product.userId !== req.user!.id && !['admin', 'moderator'].includes(req.user!.role)) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      
      const updatedProduct = await storage.updateProduct(req.params.id, req.body);
      res.json({ product: updatedProduct });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating product: ${error.message}` });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      
      // Check ownership or admin role
      if (product.userId !== req.user!.id && !['admin', 'moderator'].includes(req.user!.role)) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      
      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // E-Commerce Order Management
  app.get("/api/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, limit = 20, offset = 0 } = req.query;
      const orders = await storage.getOrders(req.user!.id, {
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json({ orders });
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      
      // Check ownership or admin role
      if (order.customerId !== req.user!.id && !['admin', 'moderator'].includes(req.user!.role)) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      
      res.json({ order });
    } catch (error) {
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { items, shippingAddress, paymentMethodId } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: "Order items are required" });
        return;
      }
      
      // Calculate total and create Stripe payment intent
      let totalAmount = 0;
      const orderItems = [];
      
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          res.status(400).json({ message: `Product not found: ${item.productId}` });
          return;
        }
        
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          total: itemTotal
        });
      }
      
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: "usd",
        payment_method: paymentMethodId,
        confirm: true,
        return_url: `${process.env.REPLIT_DEV_DOMAIN}/orders`,
        metadata: {
          userId: req.user!.id,
        },
      });
      
      // Create order in database
      const order = await storage.createOrder({
        customerId: req.user!.id,
        items: orderItems,
        totalAmount,
        shippingAddress,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'confirmed' : 'pending'
      });
      
      res.status(201).json({ 
        order, 
        clientSecret: paymentIntent.client_secret 
      });
    } catch (error: any) {
      console.error('Order creation error:', error);
      res.status(400).json({ message: `Error creating order: ${error.message}` });
    }
  });

  app.put("/api/orders/:id/status", authenticateToken, requireRole(["admin", "moderator"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        res.status(400).json({ message: "Invalid order status" });
        return;
      }
      
      const order = await storage.updateOrderStatus(req.params.id, status);
      res.json({ order });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating order: ${error.message}` });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
