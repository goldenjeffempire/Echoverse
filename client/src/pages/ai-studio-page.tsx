
import { useState } from "react";
import { ContentGenerator, ContentLibrary, TextAnalyzer } from "@/components/ai-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, BarChart2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layouts/main-layout";
import { AiContent } from "@shared/schema";
import { Card } from "@/components/ui/card";

export default function AIStudioPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("generator");
  const [selectedContent, setSelectedContent] = useState<AiContent | null>(null);

  const handleSelectContent = (content: AiContent) => {
    setSelectedContent(content);
    setActiveTab("view");
  };

  return (
    <MainLayout>
      <div className="container py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Studio</h1>
            <p className="text-muted-foreground">
              Create, analyze, and manage AI-generated content
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button variant="default" className="ml-auto bg-primary/90 hover:bg-primary">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator" className="flex items-center">
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Content Generator</span>
              <span className="sm:hidden">Generator</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Content Library</span>
              <span className="sm:hidden">Library</span>
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center">
              <BarChart2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Text Analyzer</span>
              <span className="sm:hidden">Analyzer</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="space-y-4">
            {user ? (
              <ContentGenerator 
                onComplete={(contentId) => {
                  toast({
                    title: "Content saved",
                    description: "Your content has been saved to your library.",
                  });
                }}
              />
            ) : (
              <Card className="p-6 text-center">
                <p>Please log in to generate AI content.</p>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="library" className="space-y-4">
            {user ? (
              <ContentLibrary onSelectContent={handleSelectContent} />
            ) : (
              <Card className="p-6 text-center">
                <p>Please log in to view your content library.</p>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="analyzer" className="space-y-4">
            {user ? (
              <TextAnalyzer initialText={selectedContent?.result || ""} />
            ) : (
              <Card className="p-6 text-center">
                <p>Please log in to use the text analyzer.</p>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="view" className="space-y-4">
            {!user && (
              <Card className="p-6 text-center">
                <p>Please log in to view content details.</p>
              </Card>
            )}
            {user && selectedContent && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{selectedContent.title}</h2>
                  <Button variant="outline" onClick={() => setActiveTab("library")}>
                    Back to Library
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Card className="p-6">
                      <h3 className="font-medium mb-2">Generated Content</h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap">
                          {selectedContent.result}
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  <div>
                    <Card className="p-6 space-y-4">
                      <div>
                        <h3 className="font-medium">Content Details</h3>
                        <p className="text-sm text-muted-foreground">
                          Information about this content
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">Type:</span>
                          <span className="text-sm ml-2">
                            {selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium">Created:</span>
                          <span className="text-sm ml-2">
                            {selectedContent.createdAt 
                              ? new Date(selectedContent.createdAt).toLocaleDateString() 
                              : 'Recently'}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium">Word Count:</span>
                          <span className="text-sm ml-2">
                            {selectedContent.result.split(/\s+/).length} words
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <h4 className="text-sm font-medium mb-2">Original Prompt:</h4>
                        <div className="p-3 bg-muted rounded-md text-sm">
                          {selectedContent.prompt}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 pt-2">
                        <Button variant="default" onClick={() => setActiveTab("analyzer")}>
                          <BarChart2 className="mr-2 h-4 w-4" />
                          Analyze this Content
                        </Button>
                        <Button variant="outline">
                          Edit Content
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
