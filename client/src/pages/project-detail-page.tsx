
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ArrowLeft, Plus, Check, Trash2, Move, ChevronUp, ChevronDown, Globe, LayoutTemplate } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface ProjectComponent {
  id: number;
  projectId: number;
  type: string;
  content: any;
  order: number;
}

interface Project {
  id: number;
  userId: number;
  name: string;
  description: string;
  type: string;
  settings: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
    fonts?: {
      heading?: string;
      body?: string;
    };
  };
  status: string;
  published: boolean;
  publishedUrl: string | null;
  createdAt: string;
  updatedAt: string;
  components?: ProjectComponent[];
}

export default function ProjectDetailPage() {
  const [match, params] = useRoute<{ id: string }>("/projects/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const projectId = parseInt(params?.id || "0");
  const [activeTab, setActiveTab] = useState("editor");
  const [project, setProject] = useState<Project | null>(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}`);
      return res.json();
    },
    enabled: !!projectId,
  });
  
  const { data: componentsData } = useQuery({
    queryKey: [`/api/projects/${projectId}/components`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}/components`);
      return res.json();
    },
    enabled: !!projectId,
  });
  
  useEffect(() => {
    if (data) {
      setProject(prev => {
        if (componentsData) {
          return { ...data, components: componentsData };
        }
        return data;
      });
    }
  }, [data, componentsData]);
  
  const updateProjectMutation = useMutation({
    mutationFn: async (updatedProject: Partial<Project>) => {
      const res = await apiRequest("PUT", `/api/projects/${projectId}`, updatedProject);
      return res.json();
    },
    onSuccess: (updatedProject) => {
      setProject(prev => prev ? { ...prev, ...updatedProject } : updatedProject);
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: "Project Updated",
        description: "Your project has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update project: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleInputChange = (field: keyof Project, value: any) => {
    if (project) {
      setProject({ ...project, [field]: value });
    }
  };
  
  const handleSettingsChange = (section: keyof Project["settings"], field: string, value: string) => {
    if (project) {
      setProject({
        ...project,
        settings: {
          ...project.settings,
          [section]: {
            ...(project.settings[section] || {}),
            [field]: value
          }
        }
      });
    }
  };
  
  const handleSave = () => {
    if (project) {
      updateProjectMutation.mutate({
        name: project.name,
        description: project.description,
        settings: project.settings,
      });
    }
  };
  
  const handlePublish = () => {
    if (project) {
      updateProjectMutation.mutate({
        published: !project.published,
        status: !project.published ? "published" : "draft"
      });
    }
  };
  
  const addComponentMutation = useMutation({
    mutationFn: async (componentData: { type: string; content: any; order: number }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/components`, componentData);
      return res.json();
    },
    onSuccess: (newComponent) => {
      if (project) {
        const updatedComponents = [...(project.components || []), newComponent];
        setProject({
          ...project,
          components: updatedComponents
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/components`] });
      toast({
        title: "Component Added",
        description: "The component has been added to your project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add component: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateComponentMutation = useMutation({
    mutationFn: async ({ componentId, data }: { componentId: number; data: Partial<ProjectComponent> }) => {
      const res = await apiRequest("PUT", `/api/projects/${projectId}/components/${componentId}`, data);
      return res.json();
    },
    onSuccess: (updatedComponent) => {
      if (project && project.components) {
        const updatedComponents = project.components.map(component => 
          component.id === updatedComponent.id ? updatedComponent : component
        );
        setProject({
          ...project,
          components: updatedComponents
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/components`] });
      toast({
        title: "Component Updated",
        description: "The component has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update component: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteComponentMutation = useMutation({
    mutationFn: async (componentId: number) => {
      await apiRequest("DELETE", `/api/projects/${projectId}/components/${componentId}`);
      return componentId;
    },
    onSuccess: (deletedComponentId) => {
      if (project && project.components) {
        const updatedComponents = project.components.filter(component => component.id !== deletedComponentId);
        setProject({
          ...project,
          components: updatedComponents
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/components`] });
      toast({
        title: "Component Deleted",
        description: "The component has been removed from your project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete component: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleAddComponent = (type: string) => {
    const newComponent = {
      type: type.toLowerCase(),
      content: {
        title: `New ${type}`,
        subtitle: `This is a ${type.toLowerCase()} component.`,
      },
      order: project?.components?.length || 0
    };
    
    addComponentMutation.mutate(newComponent);
  };

  const handleDeleteComponent = (componentId: number) => {
    deleteComponentMutation.mutate(componentId);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !project?.components) return;
    
    const items = Array.from(project.components);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedComponents = items.map((item, index) => ({
      ...item,
      order: index
    }));
    
    setProject({
      ...project,
      components: updatedComponents
    });
    
    updatedComponents.forEach(component => {
      updateComponentMutation.mutate({
        componentId: component.id,
        data: { order: component.order }
      });
    });
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-12 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (error || !project) {
    return (
      <MainLayout>
        <div className="container py-12">
          <Button variant="ghost" onClick={() => navigate("/projects")} className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          
          <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Error Loading Project</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              We couldn't load this project. It may have been deleted or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate("/projects")}>
              Go to Projects
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate("/projects")} className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="published"
                checked={project.published}
                onCheckedChange={handlePublish}
              />
              <Label htmlFor="published">
                {project.published ? "Published" : "Draft"}
              </Label>
            </div>
            
            <Button variant="outline" onClick={() => window.open(`/projects/${projectId}/preview`, '_blank')}>
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Preview
            </Button>
            
            {project.published && (
              <Button variant="outline" onClick={() => window.open(project.publishedUrl || '#', '_blank')}>
                <Globe className="mr-2 h-4 w-4" />
                Visit Site
              </Button>
            )}
            
            <Button onClick={handleSave} disabled={updateProjectMutation.isPending}>
              {updateProjectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="mb-6">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Components</CardTitle>
                    <CardDescription>Drag components to your page</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {["Header", "Hero", "Features", "About", "Services", "Team", "Testimonials", "Contact", "Gallery", "Pricing", "CTA", "Footer"].map((component) => (
                        <Button 
                          key={component} 
                          variant="outline" 
                          className="h-20 flex flex-col justify-center items-center text-xs"
                          onClick={() => handleAddComponent(component)}
                          disabled={addComponentMutation.isPending}
                        >
                          <div className="mb-1">
                            {addComponentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </div>
                          {component}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-3">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Page Components</CardTitle>
                      <CardDescription>Drag to reorder components</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!project.components || project.components.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400 mb-4">
                            No components added yet
                          </p>
                          <Button 
                            onClick={() => handleAddComponent("Hero")}
                            disabled={addComponentMutation.isPending}
                          >
                            {addComponentMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="mr-2 h-4 w-4" />
                            )}
                            Add First Component
                          </Button>
                        </div>
                      ) : (
                        <Droppable droppableId="components">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-3"
                            >
                              {(project.components || []).sort((a, b) => a.order - b.order).map((component, index) => (
                                <Draggable
                                  key={component.id.toString()}
                                  draggableId={component.id.toString()}
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="border rounded-lg p-4 bg-white dark:bg-gray-800"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="mr-3 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-move"
                                          >
                                            <Move className="h-5 w-5 text-gray-500" />
                                          </div>
                                          <div>
                                            <h3 className="font-medium">
                                              {component.type.charAt(0).toUpperCase() + component.type.slice(1)}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                              {Object.keys(component.content || {}).length} content fields
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                          <Button size="sm" variant="ghost">
                                            Edit
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="text-red-500"
                                            onClick={() => handleDeleteComponent(component.id)}
                                            disabled={deleteComponentMutation.isPending && deleteComponentMutation.variables === component.id}
                                          >
                                            {deleteComponentMutation.isPending && deleteComponentMutation.variables === component.id ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-4 w-4" />
                                            )}
                                          </Button>
                                          
                                          <div className="flex flex-col">
                                            <Button size="sm" variant="ghost" className="p-0 h-6">
                                              <ChevronUp className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="p-0 h-6">
                                              <ChevronDown className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      )}
                    </CardContent>
                  </Card>
                </DragDropContext>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>Basic information about your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={project.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={project.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe your project"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Design Settings</CardTitle>
                <CardDescription>Customize the look and feel of your site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Colors</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex">
                        <Input
                          id="primaryColor"
                          type="color"
                          className="w-12 p-1 h-10 mr-2"
                          value={project.settings?.colors?.primary || "#3498db"}
                          onChange={(e) => handleSettingsChange("colors", "primary", e.target.value)}
                        />
                        <Input
                          value={project.settings?.colors?.primary || "#3498db"}
                          onChange={(e) => handleSettingsChange("colors", "primary", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex">
                        <Input
                          id="secondaryColor"
                          type="color"
                          className="w-12 p-1 h-10 mr-2"
                          value={project.settings?.colors?.secondary || "#2ecc71"}
                          onChange={(e) => handleSettingsChange("colors", "secondary", e.target.value)}
                        />
                        <Input
                          value={project.settings?.colors?.secondary || "#2ecc71"}
                          onChange={(e) => handleSettingsChange("colors", "secondary", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex">
                        <Input
                          id="accentColor"
                          type="color"
                          className="w-12 p-1 h-10 mr-2"
                          value={project.settings?.colors?.accent || "#9b59b6"}
                          onChange={(e) => handleSettingsChange("colors", "accent", e.target.value)}
                        />
                        <Input
                          value={project.settings?.colors?.accent || "#9b59b6"}
                          onChange={(e) => handleSettingsChange("colors", "accent", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Typography</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="headingFont">Heading Font</Label>
                      <Input
                        id="headingFont"
                        value={project.settings?.fonts?.heading || "Montserrat"}
                        onChange={(e) => handleSettingsChange("fonts", "heading", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bodyFont">Body Font</Label>
                      <Input
                        id="bodyFont"
                        value={project.settings?.fonts?.body || "Open Sans"}
                        onChange={(e) => handleSettingsChange("fonts", "body", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={updateProjectMutation.isPending}>
                  {updateProjectMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Track performance of your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Analytics will be available once your site is published
                  </p>
                  {!project.published && (
                    <Button onClick={handlePublish}>
                      Publish Site
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
