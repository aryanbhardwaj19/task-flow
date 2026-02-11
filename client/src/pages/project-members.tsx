import { useAuth } from "@/hooks/use-auth";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, getAuthHeaders } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

export default function ProjectMembers() {
  const [match, params] = useRoute("/projects/:id/members");
  const projectId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const [newMemberUsername, setNewMemberUsername] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/members`],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ username })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/members`] });
      setNewMemberUsername("");
      toast({ title: "Member added", description: "The user has been added to the project." });
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
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">Manage who has access to this project.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                placeholder="Username" 
                value={newMemberUsername}
                onChange={(e) => setNewMemberUsername(e.target.value)}
              />
              <Button 
                onClick={() => addMemberMutation.mutate(newMemberUsername)}
                disabled={addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? <Loader2 className="animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {members?.map((member: any) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {member.username[0].toUpperCase()}
                  </div>
                  <span className="font-medium">{member.username}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
