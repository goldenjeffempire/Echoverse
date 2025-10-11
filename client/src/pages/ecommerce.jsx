import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Search, Package, TrendingUp, DollarSign, Users, Edit, Trash2, Star, Heart, ShoppingBag } from 'lucide-react';
export default function EcommercePage() {
    const [activeTab, setActiveTab] = useState('catalog');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    // Fetch products
    const fetchProducts = useCallback(async (search = '', category = '') => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                limit: '20',
                offset: '0',
                ...(search && { search }),
                ...(category && { category })
            });
            const response = await fetch(`/api/products?${params}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || []);
            }
        }
        catch (error) {
            console.error('Error fetching products:', error);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    // Fetch orders
    const fetchOrders = useCallback(async () => {
        try {
            const response = await fetch('/api/orders', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            }
        }
        catch (error) {
            console.error('Error fetching orders:', error);
        }
    }, []);
    // Add to cart
    const addToCart = useCallback((productId, quantity = 1) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.productId === productId);
            if (existingItem) {
                return prev.map(item => item.productId === productId
                    ? { ...item, quantity: item.quantity + quantity }
                    : item);
            }
            return [...prev, { productId, quantity }];
        });
    }, []);
    // Remove from cart
    const removeFromCart = useCallback((productId) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    }, []);
    // Create/Update product
    const handleSaveProduct = async (productData) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                alert('Please log in to manage products');
                return;
            }
            const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
            const method = editingProduct ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(productData),
            });
            if (response.ok) {
                setShowProductModal(false);
                setEditingProduct(null);
                fetchProducts(searchTerm, selectedCategory);
            }
            else {
                const error = await response.json();
                alert(`Error saving product: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        }
    };
    // Delete product
    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?'))
            return;
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (response.ok) {
                fetchProducts(searchTerm, selectedCategory);
            }
            else {
                const error = await response.json();
                alert(`Error deleting product: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
        }
    };
    useEffect(() => {
        fetchProducts();
        fetchOrders();
    }, [fetchProducts, fetchOrders]);
    const cartTotal = cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.productId);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
    return (<div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="text-blue-600"/>
                E-Commerce Suite
              </h1>
            </div>

            {/* Cart indicator */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingBag className="w-6 h-6 text-gray-600"/>
                {cart.length > 0 && (<span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>)}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
            { id: 'catalog', label: 'Product Catalog', icon: Package },
            { id: 'products', label: 'Manage Products', icon: Edit },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map(({ id, label, icon: Icon }) => (<button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <Icon size={18}/>
                {label}
              </button>))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Product Catalog */}
          {activeTab === 'catalog' && (<motion.div key="catalog" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {/* Search and Filter */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20}/>
                  <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchProducts(e.target.value, selectedCategory);
            }} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>
                <select value={selectedCategory} onChange={(e) => {
                setSelectedCategory(e.target.value);
                fetchProducts(searchTerm, e.target.value);
            }} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="books">Books</option>
                  <option value="home">Home & Garden</option>
                  <option value="sports">Sports</option>
                </select>
              </div>

              {/* Product Grid */}
              {isLoading ? (<div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>) : products.length === 0 ? (<div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400"/>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
                  <div className="mt-6">
                    <button onClick={() => setActiveTab('products')} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      <Plus className="-ml-1 mr-2 h-5 w-5"/>
                      Add Product
                    </button>
                  </div>
                </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (<motion.div key={product.id} whileHover={{ y: -4 }} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Product Image */}
                      <div className="h-48 bg-gray-200 relative">
                        {product.images && product.images.length > 0 ? (<img src={product.images[0]} alt={product.name} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center">
                            <Package className="text-gray-400" size={48}/>
                          </div>)}
                        <button className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-50">
                          <Heart className="w-4 h-4 text-gray-600"/>
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            ${product.price}
                          </span>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current"/>
                            <span className="text-sm text-gray-600">4.5</span>
                          </div>
                        </div>
                        <button onClick={() => addToCart(product.id)} className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                          <ShoppingCart size={16}/>
                          Add to Cart
                        </button>
                      </div>
                    </motion.div>))}
                </div>)}
            </motion.div>)}

          {/* Manage Products */}
          {activeTab === 'products' && (<motion.div key="products" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Manage Products</h2>
                <button onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
            }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus size={18}/>
                  Add Product
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inventory
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (<tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {product.images && product.images.length > 0 ? (<img className="h-10 w-10 rounded-lg object-cover" src={product.images[0]} alt={product.name}/>) : (<div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Package className="text-gray-400" size={20}/>
                                </div>)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {product.sku || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category || 'Uncategorized'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${product.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.inventory}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'}`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button onClick={() => {
                    setEditingProduct(product);
                    setShowProductModal(true);
                }} className="text-blue-600 hover:text-blue-900">
                              <Edit size={16}/>
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900">
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </motion.div>)}

          {/* Orders */}
          {activeTab === 'orders' && (<motion.div key="orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Orders</h2>

              {orders.length === 0 ? (<div className="text-center py-12">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400"/>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Orders will appear here when customers make purchases.</p>
                </div>) : (<div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (<tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customerEmail}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${order.total} {order.currency.toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>)}
            </motion.div>)}

          {/* Analytics */}
          {activeTab === 'analytics' && (<motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>

              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                { label: 'Total Revenue', value: `$${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}`, change: '+12%', icon: DollarSign, color: 'green' },
                { label: 'Orders', value: orders.length.toString(), change: '+8%', icon: ShoppingCart, color: 'blue' },
                { label: 'Products', value: products.length.toString(), change: '+3%', icon: Package, color: 'purple' },
                { label: 'Customers', value: new Set(orders.map(o => o.customerEmail)).size.toString(), change: '+15%', icon: Users, color: 'orange' }
            ].map(({ label, value, change, icon: Icon, color }) => (<div key={label} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">{label}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        <p className={`text-sm ${color === 'green' ? 'text-green-600' :
                    color === 'blue' ? 'text-blue-600' :
                        color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`}>
                          {change} from last month
                        </p>
                      </div>
                      <Icon className={`w-8 h-8 ${color === 'green' ? 'text-green-600' :
                    color === 'blue' ? 'text-blue-600' :
                        color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`}/>
                    </div>
                  </div>))}
              </div>

              {/* Charts placeholder */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Analytics</h3>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Charts and analytics coming soon!</p>
                </div>
              </div>
            </motion.div>)}
        </AnimatePresence>
      </div>

      {/* Product Modal */}
      <ProductModal isOpen={showProductModal} onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
        }} onSave={handleSaveProduct} product={editingProduct}/>
    </div>);
}
// Product Modal Component
function ProductModal({ isOpen, onClose, onSave, product }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        sku: '',
        inventory: '',
        images: ['']
    });
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price.toString(),
                category: product.category || '',
                sku: product.sku || '',
                inventory: product.inventory.toString(),
                images: product.images || ['']
            });
        }
        else {
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                sku: '',
                inventory: '',
                images: ['']
            });
        }
    }, [product]);
    if (!isOpen)
        return null;
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            price: parseFloat(formData.price),
            inventory: parseInt(formData.inventory),
            images: formData.images.filter(img => img.trim())
        });
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory
              </label>
              <input type="number" required value={formData.inventory} onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select Category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input type="text" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image URL
            </label>
            <input type="url" value={formData.images[0]} onChange={(e) => setFormData(prev => ({ ...prev, images: [e.target.value] }))} placeholder="https://example.com/image.jpg" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
