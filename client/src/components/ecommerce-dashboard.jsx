import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Package, TrendingUp, DollarSign, Plus, Search, MoreHorizontal, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
export function EcommerceDashboard() {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [productsRes, ordersRes] = await Promise.all([
                api.get('/products'),
                api.get('/orders')
            ]);
            setProducts(productsRes.products || []);
            setOrders(ordersRes.orders || []);
        }
        catch (error) {
            toast({
                title: "Error loading data",
                description: error.message || "Failed to load e-commerce data",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const outOfStock = products.filter(p => p.stock === 0).length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const getStatusBadge = (status) => {
        const variants = {
            active: "default",
            out_of_stock: "destructive",
            processing: "secondary",
            shipped: "default",
            delivered: "secondary",
            pending: "outline"
        };
        return variants[status] || "default";
    };
    const getProductStatus = (stock) => stock > 0 ? 'active' : 'out_of_stock';
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading e-commerce data...</p>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-primary"/>
            E-Commerce
          </h1>
          <p className="text-muted-foreground">Manage your online store and track sales</p>
        </div>
        <Button data-testid="button-add-product" className="gap-2">
          <Plus className="h-4 w-4"/>
          Add Product
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">From {orders.length} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-products">{products.length}</div>
            <p className="text-xs text-muted-foreground">{outOfStock} out of stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-orders">{orders.length}</div>
            <p className="text-xs text-muted-foreground">{pendingOrders} pending fulfillment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">--</div>
            <p className="text-xs text-muted-foreground">Calculate from analytics</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Manage your product catalog</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search products..." className="w-64"/>
                  <Button variant="outline" size="icon" aria-label="Search products">
                    <Search className="h-4 w-4"/>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (<p className="text-center text-muted-foreground py-8">No products yet. Create your first product to get started.</p>) : (<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (<TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(getProductStatus(product.stock))}>
                            {getProductStatus(product.stock).replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" aria-label="Product actions">
                            <MoreHorizontal className="h-4 w-4"/>
                          </Button>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Track and manage customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (<p className="text-center text-muted-foreground py-8">No orders yet.</p>) : (<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (<TableRow key={order.id}>
                        <TableCell className="font-mono">#{order.id.slice(0, 8)}</TableCell>
                        <TableCell>{order.customerEmail}</TableCell>
                        <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" aria-label="View order details">
                            <Eye className="h-4 w-4"/>
                          </Button>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Customer information coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>Detailed analytics coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);
}
