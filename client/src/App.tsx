import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import MemoryTool from "@/pages/memory-tool";
import BodyGraph from "@/pages/body-graph";
import NavigationBar from "@/components/navigation-bar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/memory-tool" component={MemoryTool} />
      <Route path="/body-graph" component={BodyGraph} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <NavigationBar />
        <main className="container mx-auto px-4 py-8">
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;