import { MainLayout } from "@/components/layouts/main-layout";
import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Layout, Type, Image, Code, Eye, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import DOMPurify from "dompurify";
import Highlight, { defaultProps, Language } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/github";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

// Component types
interface PageComponent {
  id: string;
  type: "header" | "text" | "image" | "code";
  content: string;
}

interface Page {
  id: string;
  title: string;
  components: PageComponent[];
}

export default function CMSPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  // Create a new page
  const addNewPage = () => {
    const newPage: Page = {
      id: nanoid(),
      title: "New Page",
      components: [],
    };
    setPages((prev) => [...prev, newPage]);
    setCurrentPage(newPage.id);

    toast({
      title: "Page Created",
      description: "New page has been created successfully",
    });
  };

  // Add component to current page
  const addComponent = (type: PageComponent["type"]) => {
    if (!currentPage) return;
    setPages((prev) =>
      prev.map((p) =>
        p.id === currentPage
          ? {
              ...p,
              components: [
                ...p.components,
                { id: nanoid(), type, content: "" },
              ],
            }
          : p
      )
    );
  };

  // Update component content
  const updateComponent = (
    pageId: string,
    componentId: string,
    content: string
  ) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? {
              ...p,
              components: p.components.map((c) =>
                c.id === componentId ? { ...c, content } : c
              ),
            }
          : p
      )
    );
  };

  // Delete component
  const deleteComponent = (pageId: string, componentId: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? {
              ...p,
              components: p.components.filter((c) => c.id !== componentId),
            }
          : p
      )
    );
    toast({
      title: "Component Deleted",
      description: "Component removed successfully",
    });
  };

  // Handle drag and drop reordering
  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !currentPage) return;

    const page = pages.find((p) => p.id === currentPage);
    if (!page) return;

    const components = Array.from(page.components);
    const [moved] = components.splice(result.source.index, 1);
    components.splice(result.destination.index, 0, moved);

    setPages((prev) =>
      prev.map((p) =>
        p.id === currentPage ? { ...p, components } : p
      )
    );
  };

  // Current page lookup memoized
  const currentPageObj = useMemo(
    () => pages.find((p) => p.id === currentPage) || null,
    [pages, currentPage]
  );

  // Sanitize content before rendering
  const sanitize = useCallback((dirty: string) => {
    return DOMPurify.sanitize(dirty);
  }, []);

  // Validate image URL (simple regex check)
  const isValidImageUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return /\.(jpeg|jpg|gif|png|webp|svg)$/.test(parsed.pathname.toLowerCase());
    } catch {
      return false;
    }
  };

  return (
    <MainLayout>
      <div className="container py-6 max-w-7xl">
        {/* Header + Controls */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CMS & Page Builder</h1>
            <p className="text-muted-foreground">Create and manage your content</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewMode((p) => !p)}>
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? "Edit Mode" : "Preview"}
            </Button>
            <Button onClick={addNewPage}>
              <Plus className="w-4 h-4 mr-2" />
              New Page
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Pages */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[70vh] overflow-auto">
                  {pages.length === 0 && (
                    <p className="text-muted-foreground">No pages yet. Create one!</p>
                  )}
                  {pages.map((page) => (
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
            {currentPageObj ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Input
                        aria-label="Page Title"
                        value={currentPageObj.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setPages((prev) =>
                            prev.map((p) =>
                              p.id === currentPage ? { ...p, title: newTitle } : p
                            )
                          );
                        }}
                        className="font-bold text-lg"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!previewMode && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Button
                          variant="outline"
                          onClick={() => addComponent("header")}
                          aria-label="Add Header Component"
                        >
                          <Type className="w-4 h-4 mr-2" />
                          Add Header
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addComponent("text")}
                          aria-label="Add Text Component"
                        >
                          <Type className="w-4 h-4 mr-2" />
                          Add Text
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addComponent("image")}
                          aria-label="Add Image Component"
                        >
                          <Image className="w-4 h-4 mr-2" />
                          Add Image
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addComponent("code")}
                          aria-label="Add Code Component"
                        >
                          <Code className="w-4 h-4 mr-2" />
                          Add Code
                        </Button>
                      </div>
                    )}

                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="components-list">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-4"
                          >
                            {currentPageObj.components.map((component, index) => {
                              const key = component.id;

                              if (previewMode) {
                                // Preview Mode: Render sanitized content
                                switch (component.type) {
                                  case "header":
                                    return (
                                      <motion.h2
                                        key={key}
                                        className="text-2xl font-semibold"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        dangerouslySetInnerHTML={{
                                          __html: sanitize(component.content),
                                        }}
                                      />
                                    );
                                  case "text":
                                    return (
                                      <motion.p
                                        key={key}
                                        className="text-base"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        dangerouslySetInnerHTML={{
                                          __html: sanitize(component.content),
                                        }}
                                      />
                                    );
                                  case "image":
                                    return isValidImageUrl(component.content) ? (
                                      <motion.img
                                        key={key}
                                        src={component.content}
                                        alt="User provided content"
                                        className="max-w-full rounded"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "/fallback-image.png";
                                        }}
                                      />
                                    ) : (
                                      <motion.div
                                        key={key}
                                        className="p-4 bg-red-100 text-red-700 rounded"
                                      >
                                        Invalid image URL
                                      </motion.div>
                                    );
                                  case "code":
                                    return (
                                      <Highlight
                                        {...defaultProps}
                                        theme={theme}
                                        code={component.content}
                                        language="tsx" // adjust as needed or allow user to select
                                        key={key}
                                      >
                                        {({
                                          className,
                                          style,
                                          tokens,
                                          getLineProps,
                                          getTokenProps,
                                        }) => (
                                          <pre className={className} style={{ ...style, padding: '1rem', borderRadius: '0.375rem', backgroundColor: '#f6f8fa' }}>
                                            {tokens.map((line, i) => (
                                              <div key={i} {...getLineProps({ line, key: i })}>
                                                {line.map((token, idx) => (
                                                  <span key={idx} {...getTokenProps({ token, key: idx })} />
                                                ))}
                                              </div>
                                            ))}
                                          </pre>
                                        )}
                                      </Highlight>
                                    );
                                  default:
                                    return null;
                                }
                              } else {
                                // Edit Mode: Show input fields
                                return (
                                  <Draggable key={key} draggableId={key} index={index}>
                                    {(provided) => (
                                      <motion.div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="border rounded p-4 bg-white shadow"
                                      >
                                        <div className="flex justify-between items-center mb-2">
                                          <h3 className="font-semibold capitalize">{component.type}</h3>
                                          <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => deleteComponent(currentPageObj.id, component.id)}
                                            aria-label="Delete component"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                        {(component.type === "header" || component.type === "text") && (
                                          <Input
                                            aria-label={`${component.type} content`}
                                            value={component.content}
                                            onChange={(e) =>
                                              updateComponent(currentPageObj.id, component.id, e.target.value)
                                            }
                                            placeholder={`Enter ${component.type} content`}
                                            className="w-full"
                                          />
                                        )}
                                        {component.type === "image" && (
                                          <Input
                                            aria-label="Image URL"
                                            value={component.content}
                                            onChange={(e) =>
                                              updateComponent(currentPageObj.id, component.id, e.target.value)
                                            }
                                            placeholder="Enter image URL"
                                            className="w-full"
                                          />
                                        )}
                                        {component.type === "code" && (
                                          <textarea
                                            aria-label="Code content"
                                            value={component.content}
                                            onChange={(e) =>
                                              updateComponent(currentPageObj.id, component.id, e.target.value)
                                            }
                                            placeholder="Enter code here"
                                            className="w-full p-2 border rounded font-mono text-sm resize-y min-h-[100px]"
                                          />
                                        )}
                                      </motion.div>
                                    )}
                                  </Draggable>
                                );
                              }
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="p-10 text-center text-muted-foreground">
                <p>No page selected. Create or select a page to start editing.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
