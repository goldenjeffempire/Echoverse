import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Star, Filter, Plus } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  rating: number;
  category: string;
  images?: string[];
  inventory?: number;
}

export default function ProductsPageDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Unique categories + “All” option
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category))).sort();
    return ["All", ...cats];
  }, [products]);

  // Filtered products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "" || selectedCategory === "All"
          ? true
          : product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <DashboardLayout>
      <div className="container px-4 py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-1">
              Manage and browse your product catalog
            </p>
          </div>
          <Button aria-label="Add new product">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-12 mb-6">
          <div className="md:col-span-8">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
              />
            </div>
          </div>

          <div className="md:col-span-4 flex space-x-4">
            <select
              className="flex-grow rounded-md border border-muted-foreground p-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat === "All" ? "" : cat}>
                  {cat}
                </option>
              ))}
            </select>

            <Button variant="outline" aria-label="Open filter options" disabled>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden flex flex-col">
                <CardContent className="p-4 flex flex-col flex-grow">
                  <div className="aspect-square relative mb-4 bg-muted rounded-lg overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="object-cover w-full h-full transform transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2">{product.category}</Badge>
                  </div>

                  <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">{product.rating.toFixed(1)}</span>
                    </div>
                    <span className="font-semibold">${product.price.toFixed(2)}</span>
                  </div>

                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground mt-12 text-lg">
            No products found matching your criteria.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
