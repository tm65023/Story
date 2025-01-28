import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import MemoryTool from "@/pages/memory-tool";
import BodyGraph from "@/pages/body-graph";
import Insights from "@/pages/insights";
import NavigationBar from "@/components/navigation-bar";
import AuthPage from "@/pages/auth";
import { useQuery } from "@tanstack/react-query";

function Router() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <Switch>
        <Route path="/" component={Insights} />
        <Route path="/journal" component={Home} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/memory-tool" component={MemoryTool} />
        <Route path="/body-graph" component={BodyGraph} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;