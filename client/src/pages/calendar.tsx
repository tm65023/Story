import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon } from "lucide-react";
import EntryCard from "@/components/entry-card";
import { Entry } from "@/lib/types";

export default function Calendar() {
  const [date, setDate] = useState<Date>();
  
  const { data: entries = [] } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
  });

  const filteredEntries = entries.filter((entry) =>
    date
      ? format(new Date(entry.date), "yyyy-MM-dd") ===
        format(date, "yyyy-MM-dd")
      : true
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Journal Calendar
          </h1>
          <Link href="/">
            <Button variant="ghost" size="icon">
              <HomeIcon className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          <div>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
