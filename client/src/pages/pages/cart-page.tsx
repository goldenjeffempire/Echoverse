import { MainLayout } from "@/components/layouts/main-layout";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2, ChevronRight } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "1",
      name: "Professional Website Template",
      price: 49.99,
      quantity: 1
    },
    {
      id: "2",
      name: "AI Content Generator Pack",
      price: 29.99,
      quantity: 1
    }
  ]);

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8">Your Cart</h1>

          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-xl mb-4">Your cart is empty</p>
                <Link href="/marketplace">
                  <Button>
                    Continue Shopping
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cart Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-4 border-b last:border-0"
                      >
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-light-base/70">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-medium">${item.price}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Link href="/checkout" className="w-full">
                      <Button className="w-full">
                        Proceed to Checkout
                      </Button>
                    </Link>

                    <Link href="/marketplace" className="w-full">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}