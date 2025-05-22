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

// Mock data for marketplace items (truncated for brevity - include full dataset in real code)
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
  // Other items omitted for brevity...
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
      setLocation(`/checkout?item=${item.id}&amount=${item.priceValue}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getCategoryIcon = () => {
    switch (item.category) {
      case "agent": return <span className="text-indigo-400">🤖</span>;
      case "template": return <span className="text-green-400">📄</span>;
      case "theme": return <span className="text-purple-400">🎨</span>;
      case "plugin": return <span className="text-blue-400">🔌</span>;
      default: return <span className="text-gray-400">📦</span>;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-dark-card rounded-xl border border-primary/20 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center text-2xl mr-4">{getCategoryIcon()}</div>
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

                <p className="text-light-base/80 mb-6 whitespace-pre-line">{item.longDescription}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{tag}</Badge>
                  ))}
                </div>

                <Tabs defaultValue="overview" className="mb-8">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="pt-4">
                    <p className="text-light-base/80 whitespace-pre-line">{item.longDescription}</p>
                    <Separator className="my-6" />
                    <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
                      <div>
                        <h3 className="font-semibold mb-1 flex items-center"><Calendar className="mr-2 h-4 w-4" /> Published</h3>
                        <p className="text-light-base/70">{formatDate(item.datePublished)}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 flex items-center"><Clock className="mr-2 h-4 w-4" /> Last Updated</h3>
                        <p className="text-light-base/70">{formatDate(item.lastUpdated)}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 flex items-center"><CheckCircle className="mr-2 h-4 w-4" /> Version</h3>
                        <p className="text-light-base/70">{item.version}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="pt-4">
                    <ul className="list-disc list-inside space-y-2 text-light-base/80">
                      {item.features.map((feature: string, i: number) => (
                        <li key={i}>{feature}</li>
                      ))}
                    </ul>
                  </TabsContent>

                  <TabsContent value="reviews" className="pt-4">
                    {item.reviews.length === 0 ? (
                      <p className="text-light-base/70">No reviews yet. Be the first to review!</p>
                    ) : (
                      <div className="space-y-6">
                        {item.reviews.map((review, i) => (
                          <Card key={i} className="bg-dark-card border border-primary/20">
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-4 mb-2">
                                <Avatar>
                                  {review.avatar ? (
                                    <AvatarImage src={review.avatar} alt={review.user} />
                                  ) : (
                                    <AvatarFallback>{review.user.charAt(0)}</AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{review.user}</p>
                                  <div className="flex items-center space-x-1 text-yellow-400">
                                    {[...Array(5)].map((_, idx) => (
                                      <Star
                                        key={idx}
                                        className="h-4 w-4"
                                        fill={idx < review.rating ? "currentColor" : "none"}
                                        stroke="currentColor"
                                      />
                                    ))}
                                  </div>
                                </div>
                                <time className="ml-auto text-light-base/60 text-xs">{formatDate(review.date)}</time>
                              </div>
                              <p className="text-light-base/80">{review.comment}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-dark-card rounded-xl border border-primary/20 p-6 flex flex-col space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar size="lg">
                  {item.authorAvatar ? (
                    <AvatarImage src={item.authorAvatar} alt={item.author} />
                  ) : (
                    <AvatarFallback>{item.author.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-light-base/70 text-sm">Author</p>
                  <h3 className="font-semibold">{item.author}</h3>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-light-base/70 mb-2">Price</p>
                <h2 className="text-3xl font-bold">{item.price}</h2>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={item.priceValue > 0 && !user}
                size="lg"
                className="w-full"
                aria-label={item.price === "Free" ? "Download Item" : `Buy for ${item.price}`}
              >
                {item.price === "Free" ? (
                  <>
                    <Download className="mr-2 h-5 w-5" /> Download for Free
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
                  </>
                )}
              </Button>

              <div className="flex justify-between space-x-4">
                <Button
                  variant={inCart ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={handleAddToCart}
                  aria-pressed={inCart}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" /> {inCart ? "Remove from Cart" : "Add to Cart"}
                </Button>
                <Button
                  variant={inWishlist ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={handleAddToWishlist}
                  aria-pressed={inWishlist}
                >
                  <Heart className="mr-2 h-4 w-4" /> {inWishlist ? "Remove Wishlist" : "Add to Wishlist"}
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="text-light-base/70 mb-2">Compatible with</h4>
                <ul className="flex flex-wrap gap-2">
                  {item.compatibleWith.map((plan: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-light-base/70">
                      {plan}
                    </Badge>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
