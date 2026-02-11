import { useState } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { useProject } from "@/hooks/use-projects";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/routes";
import { z } from "zod";
import { Loader2, Plus, MoreHorizontal, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, Reorder } from "framer-motion";

// Schema for creating tasks
const createTaskSchema = insertTaskSchema.pick({ title: true, description: true }).extend({
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
});

export default function ProjectDetails() {
  const [match, params] = useRoute("/projects/:id");
  const projectId = parseInt(params?.id || "0");
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId);
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [columnToAddTo, setColumnToAddTo] = useState<"todo"|"in_progress"|"done">("todo");

  const form = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: "", description: "", status: "todo" }
  });

  const handleCreateTask = async (data: z.infer<typeof createTaskSchema>) => {
    try {
      await createTask.mutateAsync({ ...data, status: columnToAddTo, assigneeId: null });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "Task added", description: "New task has been created." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create task" });
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, status: newStatus });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast({ title: "Deleted", description: "Task has been removed." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete task" });
    }
  };

  const openCreateModal = (status: "todo"|"in_progress"|"done") => {
    setColumnToAddTo(status);
    form.setValue("status", status);
    setIsCreateOpen(true);
  };

  if (projectLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3 rounded-xl" />
          <Skeleton className="h-6 w-1/2 rounded-xl" />
          <div className="grid grid-cols-3 gap-6 mt-8">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) return <Layout><div>Project not found</div></Layout>;

  // Filter tasks by status
  const todoTasks = tasks?.filter(t => t.status === "todo") || [];
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || [];
  const doneTasks = tasks?.filter(t => t.status === "done") || [];

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
          <Button onClick={() => openCreateModal("todo")} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="grid md:grid-cols-3 gap-6 flex-1 min-h-0 overflow-x-auto pb-4">
          <KanbanColumn 
            title="To Do" 
            status="todo"
            count={todoTasks.length} 
            color="bg-slate-500" 
            onAdd={() => openCreateModal("todo")}
            onTaskDrop={handleStatusChange}
          >
            {todoTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
              />
            ))}
          </KanbanColumn>

          <KanbanColumn 
            title="In Progress" 
            status="in_progress"
            count={inProgressTasks.length} 
            color="bg-blue-500" 
            onAdd={() => openCreateModal("in_progress")}
            onTaskDrop={handleStatusChange}
          >
            {inProgressTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
              />
            ))}
          </KanbanColumn>

          <KanbanColumn 
            title="Done" 
            status="done"
            count={doneTasks.length} 
            color="bg-green-500" 
            onAdd={() => openCreateModal("done")}
            onTaskDrop={handleStatusChange}
          >
            {doneTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
              />
            ))}
          </KanbanColumn>
        </div>

        {/* Create Task Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Task to {columnToAddTo.replace('_', ' ')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateTask)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input {...form.register("title")} placeholder="Task title" className="rounded-xl" autoFocus />
                {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea {...form.register("description")} placeholder="Add details..." className="rounded-xl min-h-[100px]" />
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={createTask.isPending}>
                {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Create Task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function KanbanColumn({ title, status, count, color, children, onAdd, onTaskDrop }: any) {
  return (
    <div 
      className="flex flex-col h-full bg-muted/40 rounded-2xl border border-border/50"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) onTaskDrop(parseInt(taskId), status);
      }}
    >
      <div className="p-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
            {count}
          </span>
        </div>
        <button onClick={onAdd} className="text-muted-foreground hover:text-primary transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 flex-1 space-y-3 overflow-y-auto min-h-[200px]">
        <AnimatePresence>
          {children}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete }: any) {
  const statusColors: Record<string, string> = {
    todo: "border-l-slate-400",
    in_progress: "border-l-blue-500",
    done: "border-l-green-500"
  };

  return (
    <motion.div
      layout
      draggable
      onDragStart={(e: any) => {
        if (e.dataTransfer) {
          e.dataTransfer.setData("taskId", task.id.toString());
        }
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all group relative border-l-4 cursor-grab active:cursor-grabbing ${statusColors[task.status] || "border-l-slate-400"}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm leading-snug pr-6">{task.title}</h4>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onStatusChange(task.id, 'todo')}>
              Move to Todo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task.id, 'in_progress')}>
              Move to In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task.id, 'done')}>
              Move to Done
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          <Calendar className="w-3 h-3" />
          {task.createdAt ? format(new Date(task.createdAt), 'MMM d') : ''}
        </div>
        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center border border-primary/20">
           U
        </div>
      </div>
    </motion.div>
  );
}
