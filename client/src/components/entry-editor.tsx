import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function EntryEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEntry = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/entries", {
        method: "POST",
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

      if (!res.ok) throw new Error("Failed to create entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      setTitle("");
      setContent("");
      setTags("");
      setImageUrl("");
      toast({
        title: "Success",
        description: "Your entry has been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save entry",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="What's on your mind today?"
          className="min-h-[200px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
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
      <CardFooter>
        <Button
          onClick={() => createEntry.mutate()}
          disabled={!title || !content || createEntry.isPending}
        >
          Save Entry
        </Button>
      </CardFooter>
    </Card>
  );
}
