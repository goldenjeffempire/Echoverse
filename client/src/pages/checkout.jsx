import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
export default function CheckoutPage() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: user?.email || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
    });
    const cartItems = [];
    const subtotal = 0;
    const tax = subtotal * 0.1;
    const shipping = 10;
    const total = subtotal + tax + shipping;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/orders', {
                ...formData,
                items: cartItems,
                totalAmount: total,
                currency: 'USD',
            });
            toast({
                title: 'Order placed successfully',
                description: `Your order #${response.orderNumber} has been placed`,
            });
            setLocation('/orders');
        }
        catch (err) {
            toast({
                title: 'Order failed',
                description: err.response?.data?.message || 'Failed to place order',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5"/>
                Shipping Information
              </CardTitle>
              <CardDescription>Enter your shipping details</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required disabled={loading}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required disabled={loading}/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={loading}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required disabled={loading}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required disabled={loading}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required disabled={loading}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input id="zipCode" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} required disabled={loading}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} required disabled={loading}/>
                  </div>
                </div>
              </CardContent>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5"/>
                Payment Information
              </CardTitle>
              <CardDescription>Secure payment processing via Stripe</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Payment processing will be integrated here
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading || cartItems.length === 0}>
                {loading ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Processing...
                  </>) : ('Place Order')}
              </Button>
              {cartItems.length === 0 && (<p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  Your cart is empty
                </p>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
