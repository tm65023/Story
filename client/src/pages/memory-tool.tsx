import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic } from "lucide-react";

export default function MemoryTool() {
  const [isRecording, setIsRecording] = useState(false);
  const [content, setContent] = useState("");

  // Placeholder functions to be implemented
  const startRecording = () => {
    setIsRecording(true);
    // TODO: Implement voice recording
  };

  const stopRecording = () => {
    setIsRecording(false);
    // TODO: Implement voice recording stop and transcription
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Memory Articulation Tool</h1>
      <p className="text-muted-foreground">
        Express and explore your memories through writing or voice recording.
        AI-powered prompts will help guide your journey of memory recollection.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Record Your Memory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Start writing your memory here..."
            className="min-h-[200px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          <div className="flex items-center gap-4">
            <Button
              variant={isRecording ? "destructive" : "secondary"}
              onClick={isRecording ? stopRecording : startRecording}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              {isRecording ? "Stop Recording" : "Start Voice Recording"}
            </Button>
            
            <Button disabled={!content}>
              Get AI Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TODO: Add sections for:
          - AI-generated prompts
          - Memory connections
          - Previous memories timeline
      */}
    </div>
  );
}
