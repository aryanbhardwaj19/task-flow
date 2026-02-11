import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { CheckSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const onSubmit = async (data: z.infer<typeof authSchema>) => {
    try {
      if (isLogin) {
        await login(data);
        toast({ title: "Welcome back!", description: "You have successfully logged in." });
        setLocation("/");
      } else {
        await register(data);
        toast({ title: "Account created", description: "Please log in with your new account." });
        setIsLogin(true);
        form.reset();
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive",
        title: "Error", 
        description: error.message 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      {/* Left Panel: Form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl">TaskFlow</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Enter your credentials to access your workspace." 
                : "Get started with your free account today."}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input 
                {...form.register("username")}
                placeholder="johndoe"
                className="h-11 rounded-xl"
              />
              {form.formState.errors.username && (
                <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input 
                {...form.register("password")}
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-xl"
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl font-semibold text-md shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>{" "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-primary hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Visual */}
      <div className="hidden lg:flex bg-muted/30 relative flex-col justify-center items-center p-12 overflow-hidden border-l border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        
        <div className="relative z-10 max-w-lg text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="p-8 bg-card rounded-2xl shadow-2xl border border-border/50 text-left"
          >
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="space-y-4">
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              <div className="flex gap-3 pt-4">
                <div className="h-24 w-24 bg-primary/10 rounded-xl" />
                <div className="h-24 w-24 bg-muted/50 rounded-xl" />
                <div className="h-24 w-24 bg-muted/50 rounded-xl" />
              </div>
            </div>
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold font-display">Manage projects effortlessly</h2>
            <p className="mt-2 text-muted-foreground">
              Streamline your workflow with our intuitive Kanban boards and powerful project management tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
