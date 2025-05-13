import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Wand2, 
  FileText, 
  Code2, 
  GraduationCap, 
  Mail,
  Layout,
  Loader2
} from "lucide-react";

export default function AIToolsPage() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async (type: string) => {
    if (!prompt) {
      toast({
        title: "Input Required",
        description: "Please enter a prompt to generate content",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ prompt, type })
      }).catch(error => {
        throw new Error('Network error: Failed to connect to server');
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ 
          error: `Server error: ${res.status} ${res.statusText}` 
        }));
        throw new Error(errorData.error);
      }

      const data = await res.json();
      setPrompt('');
      
      // Display the generated content
      toast({
        title: "Success",
        description: data.response ? "Content generated successfully" : "Empty response received",
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate content",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">AI Tools</h1>
            <p className="text-muted-foreground">Generate content with AI assistance</p>
          </div>
        </div>

        <Tabs defaultValue="writer" className="space-y-4">
          <TabsList>
            <TabsTrigger value="writer">
              <FileText className="w-4 h-4 mr-2" />
              Writer
            </TabsTrigger>
            <TabsTrigger value="developer">
              <Code2 className="w-4 h-4 mr-2" />
              Developer
            </TabsTrigger>
            <TabsTrigger value="teacher">
              <GraduationCap className="w-4 h-4 mr-2" />
              Teacher
            </TabsTrigger>
            <TabsTrigger value="marketer">
              <Mail className="w-4 h-4 mr-2" />
              Marketer
            </TabsTrigger>
            <TabsTrigger value="builder">
              <Layout className="w-4 h-4 mr-2" />
              Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="writer">
            <Card className="p-6">
              <div className="space-y-4">
                <Select
                  options={[
                    { label: "Blog Post", value: "blog" },
                    { label: "Article", value: "article" },
                    { label: "Social Media", value: "social" },
                    { label: "Product Description", value: "product" }
                  ]}
                />
                <Textarea
                  placeholder="What would you like to write about?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <Button onClick={() => handleGenerate('writer')} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="developer">
            <Card className="p-6">
              <div className="space-y-4">
                <Select
                  options={[
                    { label: "JavaScript", value: "javascript" },
                    { label: "Python", value: "python" },
                    { label: "TypeScript", value: "typescript" },
                    { label: "React", value: "react" }
                  ]}
                />
                <Textarea
                  placeholder="Describe the code you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <Button onClick={() => handleGenerate('developer')} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Code2 className="mr-2 h-4 w-4" />
                      Generate Code
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="teacher">
            <Card className="p-6">
              <div className="space-y-4">
                <Select
                  options={[
                    { label: "Lesson Plan", value: "lesson" },
                    { label: "Quiz", value: "quiz" },
                    { label: "Study Guide", value: "study" },
                    { label: "Exercise", value: "exercise" }
                  ]}
                />
                <Textarea
                  placeholder="What educational content would you like to create?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <Button onClick={() => handleGenerate('teacher')} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="marketer">
            <Card className="p-6">
              <div className="space-y-4">
                <Select
                  options={[
                    { label: "Email Campaign", value: "email" },
                    { label: "Ad Copy", value: "ad" },
                    { label: "Landing Page", value: "landing" },
                    { label: "Social Campaign", value: "social" }
                  ]}
                />
                <Textarea
                  placeholder="What marketing content would you like to create?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <Button onClick={() => handleGenerate('marketer')} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Generate Campaign
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="builder">
            <Card className="p-6">
              <div className="space-y-4">
                <Select
                  options={[
                    { label: "Landing Page", value: "landing" },
                    { label: "Portfolio", value: "portfolio" },
                    { label: "E-commerce", value: "ecommerce" },
                    { label: "Blog", value: "blog" }
                  ]}
                />
                <Textarea
                  placeholder="Describe the website you want to build..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <Button onClick={() => handleGenerate('builder')} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Layout className="mr-2 h-4 w-4" />
                      Generate Website
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}