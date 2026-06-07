import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect } from "react";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Projects from "@/pages/projects";
import Chat from "@/pages/chat";

const queryClient = new QueryClient();

// Configure the custom fetch to use the token
setAuthTokenGetter(() => {
  return localStorage.getItem("codeai_token");
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) {
      setLocation("/login");
    }
  }, [token, setLocation]);

  if (!token) return null;
  return <Component />;
}

function RedirectRoute() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (token) {
      setLocation("/projects");
    } else {
      setLocation("/login");
    }
  }, [token, setLocation]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RedirectRoute} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/projects">
        {() => <ProtectedRoute component={Projects} />}
      </Route>
      <Route path="/projects/:id">
        {() => <ProtectedRoute component={Chat} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
