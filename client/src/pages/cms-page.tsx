
import { MainLayout } from "@/components/layouts/main-layout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Layout, Type, Image, Code, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface PageComponent {
  id: string;
  type: 'header' | 'text' | 'image' | 'code';
  content: string;
}

export default function CMSPage() {
  const [pages, setPages] = useState<{ id: string; title: string; components: PageComponent[] }[]>([]);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const addNewPage = () => {
    const newPage = {
      id: Date.now().toString(),
      title: 'New Page',
      components: []
    };
    setPages([...pages, newPage]);
    setCurrentPage(newPage.id);
    
    toast({
      title: "Page Created",
      description: "New page has been created successfully",
    });
  };

  const addComponent = (type: PageComponent['type']) => {
    const page = pages.find(p => p.id === currentPage);
    if (!page) return;

    const newComponent: PageComponent = {
      id: Date.now().toString(),
      type,
      content: ''
    };

    const updatedPages = pages.map(p => {
      if (p.id === currentPage) {
        return {
          ...p,
          components: [...p.components, newComponent]
        };
      }
      return p;
    });

    setPages(updatedPages);
  };

  const updateComponent = (pageId: string, componentId: string, content: string) => {
    const updatedPages = pages.map(p => {
      if (p.id === pageId) {
        return {
          ...p,
          components: p.components.map(c => {
            if (c.id === componentId) {
              return { ...c, content };
            }
            return c;
          })
        };
      }
      return p;
    });

    setPages(updatedPages);
  };

  const getCurrentPage = () => pages.find(p => p.id === currentPage);

  return (
    <MainLayout>
      <div className="container py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CMS & Page Builder</h1>
            <p className="text-muted-foreground">Create and manage your content</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            <Button onClick={addNewPage}>
              <Plus className="w-4 h-4 mr-2" />
              New Page
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Pages Sidebar */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pages.map(page => (
                    <Button
                      key={page.id}
                      variant={currentPage === page.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setCurrentPage(page.id)}
                    >
                      <Layout className="w-4 h-4 mr-2" />
                      {page.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Builder Area */}
          <div className="col-span-9">
            {currentPage && getCurrentPage() ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Input
                        value={getCurrentPage()?.title}
                        onChange={(e) => {
                          const updatedPages = pages.map(p => {
                            if (p.id === currentPage) {
                              return { ...p, title: e.target.value };
                            }
                            return p;
                          });
                          setPages(updatedPages);
                        }}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!previewMode && (
                      <div className="flex gap-2 mb-4">
                        <Button variant="outline" onClick={() => addComponent('header')}>
                          <Type className="w-4 h-4 mr-2" />
                          Add Header
                        </Button>
                        <Button variant="outline" onClick={() => addComponent('text')}>
                          <Type className="w-4 h-4 mr-2" />
                          Add Text
                        </Button>
                        <Button variant="outline" onClick={() => addComponent('image')}>
                          <Image className="w-4 h-4 mr-2" />
                          Add Image
                        </Button>
                        <Button variant="outline" onClick={() => addComponent('code')}>
                          <Code className="w-4 h-4 mr-2" />
                          Add Code
                        </Button>
                      </div>
                    )}

                    <div className="space-y-4">
                      {getCurrentPage()?.components.map((component) => (
                        <motion.div
                          key={component.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4"
                        >
                          {previewMode ? (
                            <div className="prose dark:prose-invert">
                              {component.type === 'header' && <h2>{component.content}</h2>}
                              {component.type === 'text' && <p>{component.content}</p>}
                              {component.type === 'image' && (
                                <img src={component.content} alt="Content" className="max-w-full h-auto" />
                              )}
                              {component.type === 'code' && (
                                <pre>
                                  <code>{component.content}</code>
                                </pre>
                              )}
                            </div>
                          ) : (
                            <Input
                              value={component.content}
                              onChange={(e) => updateComponent(currentPage, component.id, e.target.value)}
                              placeholder={`Enter ${component.type} content...`}
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Select a page or create a new one to start building</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
