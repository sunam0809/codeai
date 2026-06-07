import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const { token, login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const registerMutation = useRegister();

  useEffect(() => {
    if (token) setLocation("/projects");
  }, [token, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    if (username.length < 3 || password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Username must be at least 3 chars, password 6 chars.",
        variant: "destructive"
      });
      return;
    }

    registerMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          setLocation("/projects");
        },
        onError: (err: any) => {
          toast({
            title: "Registration failed",
            description: err.message || "Failed to create account",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">CodeAI</h1>
          <p className="text-sm text-muted-foreground">Provision new developer identity</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="developer" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="off"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="font-mono text-sm tracking-widest"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full font-semibold" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Provisioning..." : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already authenticated?{" "}
            <Link href="/login" className="text-primary hover:underline underline-offset-4">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
