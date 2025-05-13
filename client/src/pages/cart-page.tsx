import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  ArrowLeftCircle, 
  ShoppingCart, 
  Trash2, 
  CreditCard, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Interface for cart items
interface CartItem {
  id: string;
  title: string;
  description: string;
  price: number | "Free";
  priceValue: number;
  category: "agent" | "template" | "theme" | "plugin";
  image?: string;
}

// Demo cart items - in a real application, these would be stored in a database or local storage
const demoCartItems: CartItem[] = [
  {
    id: "restaurant-website-template",
    title: "Restaurant Website Template",
    description: "Complete template for restaurants with menu management, reservations, and online ordering capabilities.",
    price: 29.99,
    priceValue: 29.99,
    category: "template"
  },
  {
    id: "dark-nebula-theme",
    title: "Dark Nebula Theme",
    description: "Premium dark theme with space-inspired gradients and animations for a sleek, modern look.",
    price: 19.99,
    priceValue: 19.99,
    category: "theme"
  }
];

export default function CartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulating fetching cart items from an API or localStorage
    setTimeout(() => {
      setCartItems(demoCartItems);
      setLoading(false);
    }, 500);
  }, []);

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
    
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
      variant: "default",
    });
  };

  const clearCart = () => {
    setCartItems([]);
    
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
      variant: "default",
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }
    
    const totalAmount = cartItems.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0);
    
    // Redirect to checkout page with the total amount
    window.location.href = `/checkout?amount=${totalAmount.toFixed(2)}`;
  };

  // Category icon based on item category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "agent":
        return <span className="text-indigo-400">🤖</span>;
      case "template":
        return <span className="text-green-400">📄</span>;
      case "theme":
        return <span className="text-purple-400">🎨</span>;
      case "plugin":
        return <span className="text-blue-400">🔌</span>;
      default:
        return <span className="text-gray-400">📦</span>;
    }
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>Shopping Cart - Echoverse</title>
        <meta name="description" content="Your shopping cart on Echoverse - Review and complete your purchases" />
      </Helmet>

      <div className="min-h-screen bg-dark-base pt-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeftCircle className="mr-2 h-4 w-4" /> Back to Marketplace
            </Button>
          </Link>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-4"
          >
            <h1 className="text-2xl md:text-3xl font-bold flex items-center">
              <ShoppingCart className="mr-3 h-6 w-6" /> Your Shopping Cart
            </h1>
            <p className="text-light-base/70 mt-2">
              {cartItems.length === 0 ? 
                "Your cart is empty" : 
                `You have ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your cart`}
            </p>
          </motion.div>

          {loading ? (
            <div className="min-h-[300px] flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cartItems.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="min-h-[300px] flex flex-col items-center justify-center text-center bg-dark-card rounded-xl border border-primary/20 p-8"
            >
              <ShoppingCart className="h-16 w-16 text-light-base/20 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-light-base/60 mb-6 max-w-md">
                Explore the marketplace to find tools, templates, and themes to enhance your Echoverse experience.
              </p>
              <Link href="/marketplace">
                <Button>Browse Marketplace</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart items list */}
              <motion.div 
                variants={itemVariants}
                className="lg:col-span-2"
              >
                <div className="bg-dark-card rounded-xl border border-primary/20 overflow-hidden">
                  <div className="p-6 flex justify-between items-center border-b border-primary/10">
                    <h2 className="font-semibold">Products</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearCart}
                      className="text-light-base/60 hover:text-light-base"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cart
                    </Button>
                  </div>
                  
                  {cartItems.map((item, index) => (
                    <div 
                      key={item.id}
                      className={`p-6 flex flex-col md:flex-row items-start md:items-center justify-between ${
                        index !== cartItems.length - 1 ? 'border-b border-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-start flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center text-xl mr-4 flex-shrink-0">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1">
                          <Link href={`/marketplace/${item.id}`}>
                            <h3 className="font-medium hover:text-primary transition-colors cursor-pointer">
                              {item.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-light-base/60 mt-1 mb-2 line-clamp-2">
                            {item.description}
                          </p>
                          <Badge className="capitalize bg-primary/10 text-primary hover:bg-primary/20">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 md:mt-0 w-full md:w-auto">
                        <div className="font-medium text-lg md:mr-8">
                          {item.price === "Free" ? (
                            <span className="text-green-400">Free</span>
                          ) : (
                            <span>${item.price}</span>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-light-base/60 hover:text-light-base"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Order summary */}
              <motion.div variants={itemVariants}>
                <Card className="bg-dark-card border-primary/20 sticky top-20">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-light-base/70">Subtotal</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-light-base/70">Taxes</span>
                        <span>${(cartTotal * 0.08).toFixed(2)}</span>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${(cartTotal * 1.08).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleCheckout}
                    >
                      Checkout <CreditCard className="ml-2 h-4 w-4" />
                    </Button>
                    
                    <Link href="/marketplace" className="w-full">
                      <Button 
                        variant="outline" 
                        className="w-full"
                      >
                        Continue Shopping <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>

                {/* Support section */}
                <Card className="bg-dark-card border-primary/20 mt-6">
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-2">Need Help?</h3>
                    <p className="text-sm text-light-base/70 mb-4">
                      Our support team is available 24/7 to assist you with your purchases.
                    </p>
                    <Link href="/help">
                      <Button variant="outline" size="sm" className="w-full">
                        Contact Support
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}