import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar as CalendarIcon, Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EntryEditor from "@/components/entry-editor";
import EntryCard from "@/components/entry-card";
import TimelineView from "@/components/timeline-view";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Entry } from "@/lib/types";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>();
  const [date, setDate] = useState<Date>(new Date());
  const [files, setFiles] = useState<FileList | null>(null);

  const { data: entries = [] } = useQuery<Entry[]>({
    queryKey: [
      `/api/search${searchQuery ? `?q=${searchQuery}` : ""}${
        selectedTag ? `&tag=${selectedTag}` : ""
      }`,
    ],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Daily Memories
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/calendar">
              <Button variant="ghost" size="icon">
                <CalendarIcon className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-[240px]",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="relative">
                <Input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {files?.length ? `${files.length} files selected` : "Upload Files"}
                </Button>
              </div>
            </div>

            <EntryEditor />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>

          <aside className="space-y-8">
            <TimelineView entries={entries} onTagSelect={setSelectedTag} />
          </aside>
        </div>
      </main>
    </div>
  );
}