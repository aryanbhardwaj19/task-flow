import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema } from "@shared/routes";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderKanban, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const createProjectSchema = insertProjectSchema.pick({ name: true, description: true });

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" }
  });

  const onSubmit = async (data: z.infer<typeof createProjectSchema>) => {
    try {
      await createProject.mutateAsync({ ...data, ownerId: "0", status: "active" }); // ownerId handled by backend session
      setOpen(false);
      form.reset();
      toast({ title: "Success", description: "Project created successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create project" });
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">My Projects</h1>
            <p className="text-muted-foreground mt-1">Manage and track your active projects</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <Input {...form.register("name")} placeholder="e.g. Q4 Marketing Plan" className="rounded-xl" />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea {...form.register("description")} placeholder="Describe the project goals..." className="rounded-xl min-h-[100px]" />
                </div>
                <Button type="submit" className="w-full rounded-xl" disabled={createProject.isPending}>
                  {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">No projects yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-center">
              Create your first project to start organizing tasks and collaborating with your team.
            </p>
            <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setOpen(true)}>
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="group relative bg-card hover:bg-card/80 border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  </div>

                  <h3 className="text-lg font-bold font-display mb-2 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
                    {project.description || "No description provided."}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                    <span>Created {project.createdAt ? format(new Date(project.createdAt), 'MMM d, yyyy') : 'Recently'}</span>
                    <span className="px-2 py-1 rounded-md bg-muted font-medium">Active</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
