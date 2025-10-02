import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function AIWebsiteBuilder() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")

  // TODO: Remove mock templates - replace with real template data
  const [templates] = useState([
    { id: 1, name: "Business Landing", category: "Business", preview: "Modern business template" },
    { id: 2, name: "E-commerce Store", category: "E-commerce", preview: "Online store template" },
    { id: 3, name: "Portfolio", category: "Creative", preview: "Creative portfolio template" },
    { id: 4, name: "Blog", category: "Content", preview: "Content-focused blog template" },
  ])

  const handleGenerate = () => {
    console.log("Generate website triggered:", prompt)
    setIsGenerating(true)
    // TODO: Implement AI website generation
    setTimeout(() => setIsGenerating(false), 2000)
  }

  const handleTemplateSelect = (templateId: number) => {
    console.log("Template selected:", templateId)
    // TODO: Implement template selection
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="hover-elevate cursor-pointer" onClick={() => handleTemplateSelect(template.id)}>
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                        <Layout className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">{template.name}</h3>
                      <Badge variant="secondary" className="text-xs mb-2">{template.category}</Badge>
                      <p className="text-xs text-muted-foreground">{template.preview}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
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