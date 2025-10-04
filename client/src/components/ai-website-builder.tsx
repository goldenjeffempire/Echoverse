import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  Bot, 
  Sparkles, 
  Eye, 
  Code, 
  Palette, 
  Layout, 
  Smartphone,
  Monitor,
  Tablet,
  Wand2,
  Download,
  Share
} from "lucide-react"

interface GeneratedWebsite {
  name: string;
  pages: any[];
  theme: any;
  navigation: any;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
}

export function AIWebsiteBuilder() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [generatedWebsite, setGeneratedWebsite] = useState<GeneratedWebsite | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access templates.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingTemplates(true)
    try {
      const industries = ['business', 'ecommerce', 'portfolio', 'blog']
      const templatePromises = industries.map(async (industry) => {
        const response = await fetch('/api/ai/generate-template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            industry,
            style: 'modern',
            features: ['responsive', 'seo-optimized']
          }),
        })
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed')
        }
        
        if (response.ok) {
          const data = await response.json()
          return data.template
        }
        return null
      })
      
      const loadedTemplates = await Promise.all(templatePromises)
      const validTemplates = loadedTemplates.filter(t => t !== null)
      
      if (validTemplates.length === 0) {
        toast({
          title: "Templates Unavailable",
          description: "Unable to load templates. Please try again later.",
          variant: "destructive",
        })
      } else {
        setTemplates(validTemplates)
      }
    } catch (error: any) {
      if (error.message === 'Authentication failed') {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        })
        localStorage.removeItem('accessToken')
      } else {
        toast({
          title: "Error Loading Templates",
          description: "Failed to load templates. Please check your connection and try again.",
          variant: "destructive",
        })
      }
      setTemplates([])
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate websites.",
        variant: "destructive",
      })
      return
    }
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-complete-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: prompt,
          businessType: 'general',
          style: 'modern',
          pages: ['home', 'about', 'contact'],
          colorScheme: 'professional',
          features: ['responsive', 'seo-optimized']
        }),
      })

      if (response.status === 401 || response.status === 403) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        })
        localStorage.removeItem('accessToken')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setGeneratedWebsite(data.website)
        setPrompt("")
        toast({
          title: "Website Generated!",
          description: "Your AI-powered website has been created successfully.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Generation Failed",
          description: error.message || "Failed to generate website. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error generating website:', error)
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTemplateSelect = async (template: Template) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use templates.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/ai/generate-component', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'hero',
          description: `Create a ${template.name} layout based on ${template.description}`,
          style: 'modern',
          content: template.preview
        }),
      })

      if (response.status === 401 || response.status === 403) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        })
        localStorage.removeItem('accessToken')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setGeneratedWebsite({
          name: template.name,
          pages: [],
          theme: {},
          navigation: {}
        })
        toast({
          title: "Template Loaded",
          description: `${template.name} template is ready for customization.`,
        })
      } else {
        toast({
          title: "Template Load Failed",
          description: "Unable to load template. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load template. Please check your connection.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            AI Website Builder
          </h1>
          <p className="text-muted-foreground">Create stunning websites with natural language prompts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-save-draft">
            <Download className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button data-testid="button-publish">
            <Share className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Natural Language Generation
              </CardTitle>
              <CardDescription>
                Describe your website idea and let AI create it for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Website Description</label>
                <Textarea
                  placeholder="e.g., Create a modern landing page for a sustainable fashion brand with hero section, product showcase, and contact form..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-website-prompt"
                />
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
                data-testid="button-generate-website"
              >
                {isGenerating ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-spin" />
                    Generating Website...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Website
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Library</CardTitle>
              <CardDescription>Start with pre-built templates and customize them</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <Card key={template.id} className="hover-elevate cursor-pointer" onClick={() => handleTemplateSelect(template)}>
                      <CardContent className="p-4">
                        <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                          <Layout className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-1">{template.name}</h3>
                        <Badge variant="secondary" className="text-xs mb-2">{template.category}</Badge>
                        <p className="text-xs text-muted-foreground">{template.preview || template.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customize" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Design Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4" />
                  Design
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" data-testid="button-change-colors">
                  <Palette className="h-4 w-4 mr-2" />
                  Change Colors
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-change-fonts">
                  <Code className="h-4 w-4 mr-2" />
                  Typography
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-change-layout">
                  <Layout className="h-4 w-4 mr-2" />
                  Layout Options
                </Button>
              </CardContent>
            </Card>

            {/* Preview Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "desktop" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("desktop")}
                    data-testid="button-desktop-view"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "tablet" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("tablet")}
                    data-testid="button-tablet-view"
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "mobile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("mobile")}
                    data-testid="button-mobile-view"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-xs h-8" data-testid="button-optimize-seo">
                  Optimize for SEO
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs h-8" data-testid="button-improve-performance">
                  Improve Performance
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs h-8" data-testid="button-enhance-accessibility">
                  Enhance Accessibility
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Area */}
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>See how your website looks across devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Layout className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Website preview will appear here</p>
                  <p className="text-xs text-muted-foreground">Currently viewing: {viewMode}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}