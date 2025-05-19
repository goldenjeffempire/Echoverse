import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Copy, PenLine, FileText, MessageSquare, Tag, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ContentType = 'blog' | 'ad' | 'product' | 'social';

interface ContentRequest {
  type: ContentType;
  topic: string;
  keywords: string;
  tone: string;
  length: string;
}

interface ContentResponse {
  title: string;
  content: string;
  metaTags: string[];
  summaries: {
    short: string;
    medium: string;
  };
}

export default function EchoWriter() {
  const [contentType, setContentType] = useState<ContentType>('blog');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentResponse | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic) {
      toast({
        title: 'Error',
        description: 'Please enter a topic for your content',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // In a real implementation, this would be a call to the OpenAI API endpoint
      // For now, we'll simulate the response with a timeout
      
      // This would be the actual API call
      // const response = await apiRequest('POST', '/api/echo-writer/generate', {
      //   type: contentType,
      //   topic,
      //   keywords,
      //   tone,
      //   length
      // });
      // const result = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate response based on content type
      let simulatedContent: ContentResponse;
      
      if (contentType === 'blog') {
        simulatedContent = {
          title: `${tone.charAt(0).toUpperCase() + tone.slice(1)} Guide to ${topic}`,
          content: `# ${topic}\n\nIntroduction to ${topic} that engages the reader immediately and sets the context for what's to come. This ${length} content is written in a ${tone} tone and incorporates key concepts related to ${keywords}.\n\n## Key Points About ${topic}\n\n1. First important aspect of ${topic}\n2. Second important consideration\n3. How ${topic} impacts your audience\n\n## Detailed Analysis\n\nIn-depth exploration of ${topic} with ${tone} language suitable for your audience. This section would contain multiple paragraphs with detailed information, examples, and insights.\n\n## Conclusion\n\nSummary of key points about ${topic} with a call to action or final thought in a ${tone} tone.`,
          metaTags: ['${topic}', ...keywords.split(',').map(k => k.trim())],
          summaries: {
            short: `A concise guide to ${topic} with key insights for beginners and experts alike.`,
            medium: `This comprehensive guide explores ${topic} from multiple angles, providing valuable insights into ${keywords.split(',')[0]} and related concepts. Written in a ${tone} tone, it's perfect for anyone looking to deepen their understanding.`
          }
        };
      } else if (contentType === 'ad') {
        simulatedContent = {
          title: `Discover ${topic} Today!`,
          content: `**${topic.toUpperCase()}**\n\n${tone.charAt(0).toUpperCase() + tone.slice(1)} ad copy that highlights the benefits of ${topic}. This ${length} advertisement focuses on ${keywords} and appeals to the target audience's needs and desires.\n\n**Limited Time Offer!**\n\nCall to action that encourages immediate response.`,
          metaTags: ['ad', 'promotion', topic, ...keywords.split(',').map(k => k.trim())],
          summaries: {
            short: `Discover amazing ${topic} - Limited offer!`,
            medium: `Don't miss our exclusive ${topic} offer featuring ${keywords.split(',')[0]}. Available for a limited time only!`
          }
        };
      } else if (contentType === 'product') {
        simulatedContent = {
          title: `${topic} - Product Description`,
          content: `**${topic}**\n\n${tone.charAt(0).toUpperCase() + tone.slice(1)} product description that highlights the features and benefits of ${topic}. This ${length} copy emphasizes ${keywords} and why customers should choose this product.\n\n**Features:**\n\n- Feature 1 related to ${keywords.split(',')[0]}\n- Feature 2 that solves customer problems\n- Feature 3 that sets the product apart\n\n**Benefits:**\n\n- How this product improves the customer's life\n- Why this product is worth the investment\n- Long-term value proposition`,
          metaTags: ['product', topic, ...keywords.split(',').map(k => k.trim())],
          summaries: {
            short: `Premium ${topic} with exceptional quality and performance.`,
            medium: `Our ${topic} features advanced ${keywords.split(',')[0]} technology, delivering unmatched performance and reliability for discerning customers.`
          }
        };
      } else {
        simulatedContent = {
          title: `${topic} - Social Post`,
          content: `**${topic}**\n\n${tone.charAt(0).toUpperCase() + tone.slice(1)} social media post about ${topic}. This ${length} post is designed to generate engagement and shares while highlighting ${keywords}.\n\n#${keywords.split(',').map(k => k.trim().replace(/\s+/g, '')).join(' #')}\n\n[Call to action encouraging likes, comments, and shares]`,
          metaTags: ['social', 'engagement', topic, ...keywords.split(',').map(k => k.trim())],
          summaries: {
            short: `Check out our latest update on ${topic}! #trending`,
            medium: `We're excited to share our latest insights about ${topic} featuring ${keywords.split(',')[0]}. Join the conversation and let us know your thoughts!`
          }
        };
      }
      
      setGeneratedContent(simulatedContent);
      
      toast({
        title: 'Content Generated',
        description: 'Your content has been created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard',
    });
  };

  const saveContent = () => {
    // In a real app, this would save to the database
    toast({
      title: 'Saved',
      description: 'Content saved to your drafts',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PenLine className="mr-2 h-6 w-6" />
            EchoWriter
          </CardTitle>
          <CardDescription>
            AI-powered content generation for blogs, ads, product descriptions, and social media
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Content Type</label>
                <Select
                  value={contentType}
                  onValueChange={(value) => setContentType(value as ContentType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog Post</SelectItem>
                    <SelectItem value="ad">Advertisement</SelectItem>
                    <SelectItem value="product">Product Description</SelectItem>
                    <SelectItem value="social">Social Media Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Topic</label>
                <Input
                  placeholder="e.g., Sustainable fashion trends"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Keywords (comma separated)</label>
                <Input
                  placeholder="e.g., eco-friendly, recycled materials, ethical"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="informative">Informative</SelectItem>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Length</label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating || !topic}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
            
            <div>
              {generatedContent ? (
                <Tabs defaultValue="content" className="h-full flex flex-col">
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="content">
                      <FileText className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">Content</span>
                    </TabsTrigger>
                    <TabsTrigger value="summaries">
                      <MessageSquare className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">Summaries</span>
                    </TabsTrigger>
                    <TabsTrigger value="meta">
                      <Tag className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">Meta Tags</span>
                    </TabsTrigger>
                    <TabsTrigger value="preview">
                      <Clock className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">Save</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="flex flex-col flex-1 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Title</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.title)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Input value={generatedContent.title} readOnly />
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Content</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.content)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea
                        className="h-[300px] flex-1"
                        value={generatedContent.content}
                        readOnly
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="summaries" className="flex flex-col space-y-4 flex-1">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Short Summary</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.summaries.short)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea
                        className="h-[120px]"
                        value={generatedContent.summaries.short}
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Medium Summary</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.summaries.medium)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea
                        className="h-[200px]"
                        value={generatedContent.summaries.medium}
                        readOnly
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="meta" className="flex flex-col space-y-4 flex-1">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Meta Tags</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.metaTags.join(', '))}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md min-h-[100px]">
                        {generatedContent.metaTags.map((tag, index) => (
                          <div
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 rounded-full text-sm"
                          >
                            {tag}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="flex flex-col space-y-4 flex-1">
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-10 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-md">
                      <Save className="h-10 w-10 text-neutral-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Save Your Content</h3>
                      <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md">
                        Save this content to your collection for future editing and publishing
                      </p>
                      <Button onClick={saveContent}>
                        Save to Drafts
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-10 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-md">
                  <Sparkles className="h-10 w-10 text-neutral-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Generate Content</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
                    Fill in the form and click "Generate Content" to create AI-powered content for your needs
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}