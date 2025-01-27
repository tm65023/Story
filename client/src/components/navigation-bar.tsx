import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BookHeart, Brain, Activity, LineChart } from "lucide-react";

export default function NavigationBar() {
  const [location] = useLocation();

  const navItems = [
    {
      title: "Daily Moment Tracker",
      href: "/",
      icon: BookHeart,
    },
    {
      title: "Memory Articulation",
      href: "/memory-tool",
      icon: Brain,
    },
    {
      title: "Body Graph",
      href: "/body-graph",
      icon: Activity,
    },
    {
      title: "Insights",
      href: "/insights",
      icon: LineChart,
    },
  ];

  return (
    <header className="border-b bg-card">
      <nav className="container mx-auto px-4">
        <ul className="flex items-center gap-8">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-2 py-4 border-b-2 hover:text-primary transition-colors",
                    location === item.href
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}