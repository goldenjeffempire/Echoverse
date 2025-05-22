// client/src/pages/ai-studio-page.tsx

import React, { useState } from "react";
import { ContentGenerator, ContentLibrary, TextAnalyzer } from "@/components/ai-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, BarChart2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layouts/main-layout";
import { AiContent } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function AIStudioPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("generator");
  const [selectedContent, setSelectedContent] = useState<AiContent | null>(null);

  // Handle user selecting a content from the library to view details
  const handleSelectContent = (content: AiContent) => {
    setSelectedContent(content);
    setActiveTab("view");
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">AI Studio</h1>
            <p className="text-muted-foreground max-w-lg mt-1">
              Create, analyze, and manage AI-generated content — all in one place.
            </p>
          </div>
          <Button variant="default" className="mt-4 md:mt-0 bg-primary/90 hover:bg-primary flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Upgrade Plan
          </Button>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="generator" className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Content Generator</span>
              <span className="sm:hidden">Generator</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Content Library</span>
              <span className="sm:hidden">Library</span>
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center justify-center gap-2">
              <BarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Text Analyzer</span>
              <span className="sm:hidden">Analyzer</span>
            </TabsTrigger>
          </TabsList>

          {/* Generator Tab */}
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

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-4">
            {user ? (
              <ContentLibrary onSelectContent={handleSelectContent} />
            ) : (
              <Card className="p-6 text-center">
                <p>Please log in to view your content library.</p>
              </Card>
            )}
          </TabsContent>

          {/* Analyzer Tab */}
          <TabsContent value="analyzer" className="space-y-4">
            {user ? (
              <TextAnalyzer initialText={selectedContent?.result || ""} />
            ) : (
              <Card className="p-6 text-center">
                <p>Please log in to use the text analyzer.</p>
              </Card>
            )}
          </TabsContent>

          {/* View Selected Content Tab */}
          <TabsContent value="view" className="space-y-4">
            {!user && (
              <Card className="p-6 text-center">
                <p>Please log in to view content details.</p>
              </Card>
            )}
            {user && selectedContent && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{selectedContent.title}</h2>
                  <Button variant="outline" onClick={() => setActiveTab("library")}>
                    Back to Library
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Card className="p-6">
                      <h3 className="font-semibold mb-2">Generated Content</h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {selectedContent.result}
                      </div>
                    </Card>
                  </div>

                  <div>
                    <Card className="p-6 space-y-4">
                      <div>
                        <h3 className="font-semibold">Content Details</h3>
                        <p className="text-sm text-muted-foreground">Information about this content</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Type:</span>{" "}
                          {selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>{" "}
                          {selectedContent.createdAt
                            ? new Date(selectedContent.createdAt).toLocaleDateString()
                            : "Recently"}
                        </div>
                        <div>
                          <span className="font-medium">Word Count:</span>{" "}
                          {selectedContent.result.split(/\s+/).length} words
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-1">Original Prompt:</h4>
                        <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                          {selectedContent.prompt}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 pt-2">
                        <Button variant="default" onClick={() => setActiveTab("analyzer")} className="flex items-center gap-2">
                          <BarChart2 className="w-4 h-4" />
                          Analyze this Content
                        </Button>
                        <Button variant="outline">Edit Content</Button>
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
