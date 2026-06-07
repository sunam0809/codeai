import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { 
  useListProjects, 
  useGetProjectStats, 
  useCreateProject,
  getListProjectsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FolderGit2, Plus, Terminal, Clock, Activity, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";

export default function Projects() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const { data: stats } = useGetProjectStats();
  
  const createProject = useCreateProject();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    createProject.mutate({ data: { name: newName, description: newDesc } }, {
      onSuccess: (project) => {
        setIsCreateOpen(false);
        setNewName("");
        setNewDesc("");
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setLocation(`/projects/${project.id}`);
      }
    });
  };

  return (
    <AppLayout activePath="/projects">
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects Workspace</h1>
            <p className="text-muted-foreground mt-1">Manage your active AI development sessions.</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-medium">
                <Plus className="h-4 w-4" />
                Initialize Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-border bg-card">
              <DialogHeader>
                <DialogTitle>New Project</DialogTitle>
                <DialogDescription>
                  Create a new workspace for your coding session.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input 
                      id="name" 
                      placeholder="kernel-module-xyz" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="font-mono text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Description (Optional)</Label>
                    <Input 
                      id="desc" 
                      placeholder="Implementation of..." 
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={!newName || createProject.isPending}>
                    {createProject.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
              <FolderGit2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{stats?.totalProjects ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{stats?.totalMessages ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                Online
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project List */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            Active Repositories
          </h2>
          
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <Card key={i} className="animate-pulse h-[160px] bg-muted/20 border-border/50"></Card>
              ))}
            </div>
          ) : projects?.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg bg-card/30">
              <FolderGit2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No projects found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Initialize your first workspace to begin.</p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                Create Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects?.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-card/50 border-border/50 group flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-mono text-primary group-hover:text-primary transition-colors line-clamp-1">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm mt-1 h-10">
                        {project.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <div className="flex-1"></div>
                    <CardFooter className="pt-2 text-xs text-muted-foreground flex justify-between items-center border-t border-border/30 mt-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded font-mono">
                        {project.messageCount || 0} msgs
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
