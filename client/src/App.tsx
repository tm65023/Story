
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route } from "wouter";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import MemoryTool from "@/pages/memory-tool";
import BodyGraph from "@/pages/body-graph";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/memory-tool" component={MemoryTool} />
          <Route path="/body-graph" component={BodyGraph} />
        </Switch>
      </div>
    </QueryClientProvider>
  );
}

export default App;
