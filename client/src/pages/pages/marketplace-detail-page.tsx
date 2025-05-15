import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useRoute, Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  ArrowLeftCircle, 
  ShoppingCart, 
  Star, 
  Award, 
  Download, 
  Share2, 
  Heart, 
  Clock, 
  CheckCircle, 
  User, 
  MessageSquare,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Mock data for marketplace items
const marketplaceItems = [
  {
    id: "email-generator-agent",
    title: "Email Generator Agent",
    description: "AI agent that creates personalized email templates for marketing campaigns, follow-ups, and customer outreach.",
    longDescription: "The Email Generator Agent is a sophisticated AI tool that helps businesses create personalized, engaging emails for various purposes. From marketing campaigns to customer outreach and follow-ups, this agent uses advanced natural language processing to craft emails that sound human-written while saving you hours of work.\n\nWith customizable templates and tone settings, you can ensure your emails match your brand voice while still benefiting from AI-powered content generation. The agent can also analyze response rates and suggest improvements for future campaigns.",
    price: "Free",
    priceValue: 0,
    author: "EchoTeam",
    authorAvatar: "",
    category: "agent",
    rating: 4.8,
    downloads: 12543,
    tags: ["email", "marketing", "ai"],
    datePublished: "2024-02-15",
    lastUpdated: "2024-04-12",
    version: "1.2.3",
    compatibleWith: ["All plans"],
    features: [
      "Generate personalized email templates",
      "Multiple tone options (formal, friendly, persuasive)",
      "Follow-up sequence generation",
      "Performance analytics for sent emails",
      "Export to common email platforms"
    ],
    reviews: [
      {
        user: "MarketingPro",
        avatar: "",
        rating: 5,
        date: "2024-03-18",
        comment: "This tool has completely transformed our email outreach. We're seeing 30% higher open rates and much better engagement since implementing it."
      },
      {
        user: "SmallBizOwner",
        avatar: "",
        rating: 4,
        date: "2024-04-02",
        comment: "Really useful for someone like me who struggles with writing compelling emails. Occasionally needs some tweaking, but overall a huge time saver."
      },
      {
        user: "ContentManager",
        avatar: "",
        rating: 5,
        date: "2024-02-28",
        comment: "The ability to maintain consistent voice across all our email communications while saving hours of work is incredible. One of the best tools we've adopted this year."
      }
    ]
  },
  {
    id: "restaurant-website-template",
    title: "Restaurant Website Template",
    description: "Complete template for restaurants with menu management, reservations, and online ordering capabilities.",
    longDescription: "The Restaurant Website Template is a comprehensive solution designed specifically for food service businesses. This template includes everything a restaurant needs for an effective online presence: beautiful food photography layouts, easy menu management, table reservation system, and seamless online ordering capabilities.\n\nBuilt with performance and mobile responsiveness in mind, this template ensures your restaurant website looks great and functions perfectly on any device. The customizable design elements make it easy to match your restaurant's branding while maintaining professional aesthetics that showcase your food and atmosphere.",
    price: 29.99,
    priceValue: 29.99,
    author: "DesignMasters",
    authorAvatar: "",
    category: "template",
    rating: 4.9,
    downloads: 8765,
    tags: ["restaurant", "food", "business"],
    datePublished: "2023-11-05",
    lastUpdated: "2024-03-22",
    version: "2.1.0",
    compatibleWith: ["Pro plan", "Enterprise plan"],
    features: [
      "Mobile-responsive design",
      "Easy menu management system",
      "Online reservation integration",
      "Online ordering capabilities",
      "Photo gallery with lightbox",
      "Customer testimonials section",
      "Google Maps integration",
      "Contact form with spam protection"
    ],
    reviews: [
      {
        user: "ChefMaria",
        avatar: "",
        rating: 5,
        date: "2024-01-14",
        comment: "We launched our new website using this template and immediately saw an increase in online orders. The menu management is intuitive and our customers love the reservation system."
      },
      {
        user: "CafeOwner",
        avatar: "",
        rating: 5,
        date: "2024-02-28",
        comment: "Worth every penny. We were able to customize it to match our brand perfectly, and the technical support has been excellent when we needed help with the ordering system."
      },
      {
        user: "FoodTruckPro",
        avatar: "",
        rating: 4,
        date: "2023-12-10",
        comment: "Great template overall, though we had to make some modifications for our food truck business. Still, it saved us thousands compared to a custom website."
      }
    ]
  },
  {
    id: "dark-nebula-theme",
    title: "Dark Nebula Theme",
    description: "Premium dark theme with space-inspired gradients and animations for a sleek, modern look.",
    longDescription: "The Dark Nebula Theme transforms your application with a stunning cosmic aesthetic. This premium dark theme features space-inspired gradients, subtle animations, and a carefully crafted color palette that reduces eye strain while creating a sleek, modern look.\n\nDesigned for both aesthetics and usability, Dark Nebula includes optimized contrast ratios for improved readability and accessibility. The theme comes with over 120 UI components styled with cosmic elements, compatible with popular frontend frameworks.",
    price: 19.99,
    priceValue: 19.99,
    author: "SpaceThemes",
    authorAvatar: "",
    category: "theme",
    rating: 4.7,
    downloads: 5432,
    tags: ["dark", "space", "premium"],
    datePublished: "2023-12-10",
    lastUpdated: "2024-04-05",
    version: "1.5.2",
    compatibleWith: ["All plans"],
    features: [
      "Space-inspired gradient design",
      "Subtle UI animations",
      "120+ styled components",
      "Optimized for accessibility",
      "Custom cursor options",
      "Animated transitions",
      "Compatible with major frameworks",
      "Automatic dark mode detection"
    ],
    reviews: [
      {
        user: "UXDesigner",
        avatar: "",
        rating: 5,
        date: "2024-01-18",
        comment: "This theme is absolutely gorgeous. The attention to detail in the animations and the overall cohesiveness of the design is impressive. My clients love it."
      },
      {
        user: "WebDev123",
        avatar: "",
        rating: 4,
        date: "2024-02-05",
        comment: "Great looking theme that was easy to implement. Knocked off one star because a few components needed additional tweaking for our specific use case."
      },
      {
        user: "TechStartup",
        avatar: "",
        rating: 5,
        date: "2024-03-12",
        comment: "Our users have been raving about our new interface since we implemented this theme. The space-inspired elements give our app a unique feel that stands out from competitors."
      }
    ]
  }
];

export default function MarketplaceDetailPage() {
  const [match, params] = useRoute<{ id: string }>('/marketplace/:id');
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [inCart, setInCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  
  useEffect(() => {
    // In a real app, you'd fetch the item data from an API
    // For now, we'll use the mock data
    if (params?.id) {
      const foundItem = marketplaceItems.find(item => item.id === params.id);
      setItem(foundItem || null);
      setLoading(false);
    }
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-dark-base pt-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeftCircle className="mr-2 h-4 w-4" /> Back to Marketplace
            </Button>
          </Link>
          
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Item Not Found</h1>
            <p className="text-light-base/70 mb-6">The marketplace item you're looking for doesn't exist or has been removed.</p>
            <Link href="/marketplace">
              <Button>Return to Marketplace</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    setInCart(!inCart);
    toast({
      title: inCart ? "Removed from cart" : "Added to cart",
      description: inCart ? `${item.title} has been removed from your cart.` : `${item.title} has been added to your cart.`,
      variant: inCart ? "destructive" : "default",
    });
  };

  const handleAddToWishlist = () => {
    setInWishlist(!inWishlist);
    toast({
      title: inWishlist ? "Removed from wishlist" : "Added to wishlist",
      description: inWishlist ? `${item.title} has been removed from your wishlist.` : `${item.title} has been added to your wishlist.`,
      variant: "default",
    });
  };

  const handlePurchase = () => {
    if (item.price === "Free") {
      toast({
        title: "Item downloaded",
        description: `${item.title} has been successfully downloaded and added to your account.`,
        variant: "default",
      });
    } else {
      // For paid items, redirect to checkout
      setLocation(`/checkout?item=${item.id}&amount=${item.priceValue}`);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Category icon based on item category
  const getCategoryIcon = () => {
    switch (item.category) {
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
        <title>{item.title} - Echoverse Marketplace</title>
        <meta name="description" content={item.description} />
      </Helmet>

      <div className="min-h-screen bg-dark-base pt-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeftCircle className="mr-2 h-4 w-4" /> Back to Marketplace
            </Button>
          </Link>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left column - Item details */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="bg-dark-card rounded-xl border border-primary/20 overflow-hidden">
                {/* Header */}
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center text-2xl mr-4">
                        {getCategoryIcon()}
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold">{item.title}</h1>
                        <div className="flex items-center mt-1 space-x-2">
                          <Badge className="capitalize bg-primary/10 text-primary hover:bg-primary/20">{item.category}</Badge>
                          <span className="text-sm text-light-base/60">by {item.author}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                        <span className="font-medium">{item.rating.toFixed(1)}</span>
                      </div>
                      <Badge variant="outline" className="text-light-base/70">
                        <Download className="h-3 w-3 mr-1" />
                        {item.downloads.toLocaleString()}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-light-base/80 mb-6">{item.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="px-6 md:px-8">
                  <TabsList className="mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews ({item.reviews.length})</TabsTrigger>
                  </TabsList>

                  {/* Overview tab */}
                  <TabsContent value="overview" className="pb-8">
                    <div className="prose prose-invert max-w-none">
                      {item.longDescription.split('\n\n').map((paragraph: string, i: number) => (
                        <p key={i} className="text-light-base/80 mb-4">{paragraph}</p>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      <div className="flex items-center space-x-2 text-light-base/70">
                        <Calendar className="h-4 w-4 text-primary/70" />
                        <span>Published: {formatDate(item.datePublished)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-light-base/70">
                        <Clock className="h-4 w-4 text-primary/70" />
                        <span>Last updated: {formatDate(item.lastUpdated)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-light-base/70">
                        <CheckCircle className="h-4 w-4 text-primary/70" />
                        <span>Version: {item.version}</span>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Features tab */}
                  <TabsContent value="features" className="pb-8">
                    <ul className="space-y-4">
                      {item.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-light-base/80">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Separator className="my-6" />

                    <div className="rounded-lg bg-primary/5 p-4">
                      <h3 className="text-md font-medium mb-2">Compatible with:</h3>
                      <div className="flex flex-wrap gap-2">
                        {item.compatibleWith.map((plan: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-dark-default">
                            {plan}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Reviews tab */}
                  <TabsContent value="reviews" className="pb-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="text-3xl font-bold text-white mr-3">{item.rating.toFixed(1)}</div>
                        <div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className="h-5 w-5 text-yellow-400" 
                                fill={i < Math.floor(item.rating) ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-light-base/60">Based on {item.reviews.length} reviews</span>
                        </div>
                      </div>
                      
                      <Button disabled={!user} onClick={() => {
                        toast({
                          title: "Feature coming soon",
                          description: "The ability to write reviews will be available in a future update.",
                          variant: "default",
                        });
                      }}>
                        Write a Review
                      </Button>
                    </div>

                    <Separator className="mb-6" />

                    <div className="space-y-6">
                      {item.reviews.map((review: any, i: number) => (
                        <div key={i} className="pb-6 border-b border-primary/10 last:border-b-0 last:pb-0">
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarFallback>{review.user.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{review.user}</div>
                                <div className="text-sm text-light-base/60">{formatDate(review.date)}</div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className="h-4 w-4 text-yellow-400" 
                                  fill={i < review.rating ? "currentColor" : "none"}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-light-base/80">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>

            {/* Right column - Purchase info */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <Card className="bg-dark-card border-primary/20 sticky top-20">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold mb-1">
                      {item.price === "Free" ? (
                        <span className="text-green-400">Free</span>
                      ) : (
                        <span>${item.price}</span>
                      )}
                    </div>
                    {item.price !== "Free" && (
                      <p className="text-sm text-light-base/60">One-time payment</p>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handlePurchase}
                    >
                      {item.price === "Free" ? "Download Now" : "Purchase Now"}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleAddToCart}
                    >
                      {inCart ? "Remove from Cart" : "Add to Cart"}
                      <ShoppingCart className="ml-2 h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={handleAddToWishlist}
                    >
                      {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                      <Heart className={`ml-2 h-4 w-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-light-base/50 mr-3" />
                      <div>
                        <p className="text-sm text-light-base/60">Creator</p>
                        <p className="font-medium">{item.author}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 text-light-base/50 mr-3" />
                      <div>
                        <p className="text-sm text-light-base/60">Support</p>
                        <p className="font-medium">Email & Forum</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-light-base/50 mr-3" />
                      <div>
                        <p className="text-sm text-light-base/60">Satisfaction</p>
                        <p className="font-medium">30-day guarantee</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="flex justify-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => {
                      toast({
                        title: "Feature coming soon",
                        description: "Sharing functionality will be available in a future update.",
                        variant: "default",
                      });
                    }}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    
                    <Button variant="ghost" size="sm" onClick={() => {
                      toast({
                        title: "Feature coming soon",
                        description: "Creator contact functionality will be available in a future update.",
                        variant: "default",
                      });
                    }}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Related items section */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="mt-12"
          >
            <h2 className="text-xl font-bold mb-6">You might also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {marketplaceItems
                .filter(relatedItem => relatedItem.id !== item.id && 
                  (relatedItem.category === item.category || 
                   relatedItem.tags.some(tag => item.tags.includes(tag))))
                .slice(0, 3)
                .map((relatedItem, index) => (
                  <Card key={index} className="bg-dark-card border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
                    <Link href={`/marketplace/${relatedItem.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-${relatedItem.category === 'agent' ? 'cosmic' : relatedItem.category === 'template' ? 'blue' : 'purple'} flex items-center justify-center`}>
                            {getCategoryIcon()}
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                            <span className="text-sm">{relatedItem.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-medium mb-1">{relatedItem.title}</h3>
                        <p className="text-light-base/60 text-sm mb-3 line-clamp-2">{relatedItem.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="font-medium">
                            {relatedItem.price === "Free" ? (
                              <span className="text-green-400">Free</span>
                            ) : (
                              <span>${relatedItem.price}</span>
                            )}
                          </div>
                          <Badge className="capitalize bg-primary/10 text-primary hover:bg-primary/20">
                            {relatedItem.category}
                          </Badge>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}