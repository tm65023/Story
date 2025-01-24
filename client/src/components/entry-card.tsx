import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit2, Trash2, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Entry } from "@/lib/types";

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [tags, setTags] = useState(
    entry.entryTags.map((et) => et.tag.name).join(", ")
  );
  const [imageUrl, setImageUrl] = useState(entry.imageUrl);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateEntry = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          imageUrl,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Failed to update entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Entry updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete entry");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    },
  });

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
          />
          <Input
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <Input
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={() => updateEntry.mutate()}
            disabled={updateEntry.isPending}
          >
            <Check className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{entry.title}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm("Are you sure you want to delete this entry?")) {
                  deleteEntry.mutate();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {format(new Date(entry.date), "MMMM d, yyyy")}
        </p>
        <p className="whitespace-pre-wrap">{entry.content}</p>
        {entry.imageUrl && (
          <img
            src={entry.imageUrl}
            alt=""
            className="rounded-md max-h-[300px] object-cover"
          />
        )}
        <div className="flex flex-wrap gap-2">
          {entry.entryTags.map((et) => (
            <Badge key={et.tag.id} variant="secondary">
              {et.tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
