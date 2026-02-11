import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LogOut, 
  LayoutGrid, 
  Settings, 
  Plus, 
  Search,
  CheckSquare,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const isProjectPage = location.startsWith("/projects/");
  const projectId = isProjectPage ? location.split("/")[2] : null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-2xl text-primary cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            TaskFlow
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link href="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <LayoutGrid className="w-5 h-5" />
            My Projects
          </Link>
          
          {projectId && (
            <>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mt-8 mb-2">
                Project
              </div>
              <Link href={`/projects/${projectId}`} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location === `/projects/${projectId}` ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <CheckSquare className="w-5 h-5" />
                Tasks
              </Link>
              <Link href={`/projects/${projectId}/members`} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location === `/projects/${projectId}/members` ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Users className="w-5 h-5" />
                Team Members
              </Link>
              <Link href={`/projects/${projectId}/settings`} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location === `/projects/${projectId}/settings` ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50">
            <Avatar className="h-9 w-9 bg-primary/20 text-primary font-bold">
              <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground truncate">Free Plan</p>
            </div>
            <button 
              onClick={logout}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        {/* Header - Search */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm outline-none"
                placeholder="Search projects or tasks..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
             {/* Add global actions here if needed */}
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
