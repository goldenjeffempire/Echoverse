
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlusCircle, Loader2, Globe, Edit3, Trash2, Copy, Eye } from "lucide-react";

interface Project {
  id: number;
  userId: number;
  name: string;
  description: string;
  type: string;
  settings: any;
  status: string;
  published: boolean;
  publishedUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    type: "portfolio"
  });
  
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects");
      return res.json();
    }
  });
  
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: typeof newProject) => {
      const res = await apiRequest("POST", "/api/projects", projectData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      setNewProject({ name: "", description: "", type: "portfolio" });
      toast({
        title: "Project Created",
        description: "Your new project has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Deleted",
        description: "Your project has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete project: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a project name.",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(newProject);
  };
  
  const handleDeleteProject = (projectId: number) => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const handleEditProject = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };
  
  const handleViewProject = (projectId: number) => {
    navigate(`/projects/${projectId}/preview`);
  };
  
  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case "portfolio": return "Portfolio";
      case "business": return "Business Website";
      case "landing": return "Landing Page";
      case "blog": return "Blog";
      case "ecommerce": return "E-commerce";
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  const getProjectStatusBadge = (status: string) => {
    const statusClasses = {
      draft: "bg-gray-200 text-gray-800",
      published: "bg-green-200 text-green-800",
      archived: "bg-red-200 text-red-800"
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusClasses[status as keyof typeof statusClasses] || statusClasses.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  // Calculate some stats
  const totalProjects = projects?.length || 0;
  const publishedProjects = projects?.filter(p => p.published).length || 0;
  const draftProjects = projects?.filter(p => !p.published).length || 0;
  
  return (
    <MainLayout>
      <div className="container py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Create and manage your EchoBuilder projects
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Fill in the details to create your new project.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      placeholder="My Awesome Project"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      placeholder="A brief description of your project"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Project Type</Label>
                    <Select 
                      value={newProject.type}
                      onValueChange={(value) => setNewProject({...newProject, type: value})}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portfolio">Portfolio</SelectItem>
                        <SelectItem value="business">Business Website</SelectItem>
                        <SelectItem value="landing">Landing Page</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createProjectMutation.isPending}>
                    {createProjectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Project Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{publishedProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-yellow-600">{draftProjects}</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <ProjectGrid 
              projects={projects || []} 
              isLoading={isLoading}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onView={handleViewProject}
              getProjectTypeLabel={getProjectTypeLabel}
              getProjectStatusBadge={getProjectStatusBadge}
            />
          </TabsContent>
          
          <TabsContent value="published">
            <ProjectGrid 
              projects={(projects || []).filter(p => p.published)} 
              isLoading={isLoading}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onView={handleViewProject}
              getProjectTypeLabel={getProjectTypeLabel}
              getProjectStatusBadge={getProjectStatusBadge}
            />
          </TabsContent>
          
          <TabsContent value="draft">
            <ProjectGrid 
              projects={(projects || []).filter(p => !p.published)} 
              isLoading={isLoading}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onView={handleViewProject}
              getProjectTypeLabel={getProjectTypeLabel}
              getProjectStatusBadge={getProjectStatusBadge}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

interface ProjectGridProps {
  projects: Project[];
  isLoading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  getProjectTypeLabel: (type: string) => string;
  getProjectStatusBadge: (status: string) => JSX.Element;
}

function ProjectGrid({ 
  projects, 
  isLoading, 
  onEdit, 
  onDelete, 
  onView,
  getProjectTypeLabel,
  getProjectStatusBadge
}: ProjectGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-medium mb-2">No projects found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Get started by creating your first project.
        </p>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </DialogTrigger>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="mb-1">{project.name}</CardTitle>
                <CardDescription>
                  {getProjectTypeLabel(project.type)}
                </CardDescription>
              </div>
              <div>
                {getProjectStatusBadge(project.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-gray-500 dark:text-gray-400 line-clamp-3 text-sm">
              {project.description || "No description provided."}
            </p>
            <div className="mt-4 text-xs text-gray-500">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t flex justify-between">
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" onClick={() => onEdit(project.id)}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              {project.published && (
                <Button size="sm" variant="ghost" onClick={() => window.open(project.publishedUrl || '#', '_blank')}>
                  <Globe className="h-4 w-4 mr-1" />
                  Visit
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" onClick={() => onView(project.id)}>
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => onDelete(project.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
