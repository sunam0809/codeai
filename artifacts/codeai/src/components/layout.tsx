import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Terminal, FolderGit2, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface AppLayoutProps {
  children: ReactNode;
  activePath?: string;
}

export function AppLayout({ children, activePath = "/projects" }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border/50">
          <Link href="/projects" className="flex items-center gap-2 text-foreground font-semibold">
            <div className="bg-primary/10 text-primary p-1 rounded">
              <Terminal className="h-5 w-5" />
            </div>
            <span>CodeAI</span>
          </Link>
        </div>
        
        <div className="flex-1 py-4 flex flex-col gap-1 px-2">
          <div className="text-xs font-mono text-muted-foreground px-2 mb-2 uppercase tracking-wider">
            Workspace
          </div>
          
          <Link href="/projects" className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${activePath.startsWith('/projects') ? 'bg-primary/10 text-primary font-medium' : 'text-sidebar-foreground hover:bg-sidebar-border/50'}`}>
            <FolderGit2 className="h-4 w-4" />
            <span>Projects</span>
          </Link>
        </div>

        <div className="p-4 border-t border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-muted text-muted-foreground font-mono">
                {user?.username.substring(0, 2).toUpperCase() || "US"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate font-mono">Developer</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleLogout} title="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-background">
          <Link href="/projects" className="flex items-center gap-2 text-foreground font-semibold">
            <Terminal className="h-5 w-5 text-primary" />
            <span>CodeAI</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
