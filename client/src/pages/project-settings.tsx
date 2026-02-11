import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, getAuthHeaders } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

export default function ProjectSettings() {
  const [match, params] = useRoute("/projects/:id/settings");
  const projectId = parseInt(params?.id || "0");
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    }
  });

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({ title: "Settings saved", description: "Project details have been updated." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  if (isLoading) return <Layout><Loader2 className="animate-spin" /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your project configuration.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Update the name and description of your project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button 
              onClick={() => updateMutation.mutate({ name, description })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
