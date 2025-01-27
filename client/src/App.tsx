import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route, Redirect } from "wouter";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import MemoryTool from "@/pages/memory-tool";
import BodyGraph from "@/pages/body-graph";
import Insights from "@/pages/insights";
import AuthPage from "@/pages/auth";
import NavigationBar from "@/components/navigation-bar";
import { useAuth } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  return <Component />;
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {isAuthenticated && <NavigationBar />}
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={() => <ProtectedRoute component={Home} />} />
          <Route path="/calendar" component={() => <ProtectedRoute component={Calendar} />} />
          <Route path="/memory-tool" component={() => <ProtectedRoute component={MemoryTool} />} />
          <Route path="/body-graph" component={() => <ProtectedRoute component={BodyGraph} />} />
          <Route path="/insights" component={() => <ProtectedRoute component={Insights} />} />
        </Switch>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;