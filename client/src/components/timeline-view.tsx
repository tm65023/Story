import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Entry } from "@/lib/types";

interface TimelineViewProps {
  entries: Entry[];
  onTagSelect: (tag: string) => void;
}

export default function TimelineView({ entries, onTagSelect }: TimelineViewProps) {
  const tags = new Map<string, number>();
  
  entries.forEach((entry) => {
    entry.entryTags.forEach((et) => {
      const count = tags.get(et.tag.name) || 0;
      tags.set(et.tag.name, count + 1);
    });
  });

  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Tags</h2>
      </div>
      <ScrollArea className="h-[400px] p-4">
        <div className="flex flex-wrap gap-2">
          {Array.from(tags.entries()).map(([tag, count]) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => onTagSelect(tag)}
            >
              {tag} ({count})
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
