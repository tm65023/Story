import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Entry } from "@/lib/types";

interface StoryExport {
  id: number;
  title: string;
  dateRange: string;
  entriesCount: number;
  createdAt: string;
}

export default function StoryCompilation() {
  const [title, setTitle] = useState("");
  const [timeRange, setTimeRange] = useState("30");
  const { toast } = useToast();

  // Get all entries for preview
  const { data: entries = [] } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
  });

  // Get existing story exports
  const { data: storyExports = [], refetch: refetchExports } = useQuery<StoryExport[]>({
    queryKey: ["/api/story-exports"],
  });

  // Create new story export
  const createExport = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/story-exports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          timeRange: parseInt(timeRange),
        }),
      });

      if (!res.ok) throw new Error("Failed to create story export");
      return res.json();
    },
    onSuccess: () => {
      refetchExports();
      setTitle("");
      toast({
        title: "Success",
        description: "Story compilation created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create story compilation",
        variant: "destructive",
      });
    },
  });

  // Download story export
  const downloadExport = async (id: number) => {
    try {
      const res = await fetch(`/api/story-exports/${id}/download`);
      if (!res.ok) throw new Error("Failed to download story");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `story-export-${id}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download story",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Life Story Compilations</h1>
        <p className="text-muted-foreground">
          Create beautiful compilations of your journal entries, emotional patterns,
          and body sensations to export and share your journey.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Story</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_200px]">
            <Input
              placeholder="Story Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="0">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Preview</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {entries.length} entries available for compilation
            </p>
            <div className="space-y-2">
              {entries.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className="text-sm text-muted-foreground truncate"
                >
                  {format(new Date(entry.date), "MMM d, yyyy")} - {entry.title}
                </div>
              ))}
              {entries.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  And {entries.length - 3} more entries...
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={() => createExport.mutate()}
            disabled={!title || createExport.isPending}
            className="w-full"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Create Story Compilation
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Story Compilations</h2>
        {storyExports.map((exp) => (
          <Card key={exp.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-medium">{exp.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {exp.entriesCount} entries from {exp.dateRange}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created on {format(new Date(exp.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => downloadExport(exp.id)}
              >
                <FileDown className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
