import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
export default function OrdersPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);
    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders', {
                params: { limit: 50, offset: 0 },
            });
            setOrders(response.data);
        }
        catch (err) {
            toast({
                title: 'Failed to load orders',
                description: err.response?.data?.message || 'Could not fetch your orders',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-500',
            processing: 'bg-blue-500',
            shipped: 'bg-purple-500',
            delivered: 'bg-green-500',
            cancelled: 'bg-red-500',
        };
        return colors[status.toLowerCase()] || 'bg-gray-500';
    };
    if (loading) {
        return (<div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin"/>
      </div>);
    }
    if (!user) {
        return (<div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="pt-6">
            <p>Please log in to view your orders.</p>
          </CardContent>
        </Card>
      </div>);
    }
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-gray-600 dark:text-gray-400">Track and manage your orders</p>
      </div>

      {orders.length === 0 ? (<Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4"/>
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Start shopping to see your orders here</p>
            <Button onClick={() => window.location.href = '/ecommerce'}>
              Browse Products
            </Button>
          </CardContent>
        </Card>) : (<div className="space-y-4">
          {orders.map((order) => (<Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                    <CardDescription>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.items?.length || 0} item(s)
                    </p>
                  </div>
                  <Button variant="ghost">
                    View Details
                    <ChevronRight className="ml-2 h-4 w-4"/>
                  </Button>
                </div>
              </CardContent>
            </Card>))}
        </div>)}
    </div>);
}
