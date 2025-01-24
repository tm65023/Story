import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BodyOutline from "@/components/body-outline";

type Sensation = {
  x: number;
  y: number;
  type: string;
  intensity: number;
  notes?: string;
};

const sensationTypes = [
  { value: "pain", label: "Pain", color: "bg-red-500" },
  { value: "tension", label: "Tension", color: "bg-orange-500" },
  { value: "numbness", label: "Numbness", color: "bg-blue-500" },
  { value: "tingling", label: "Tingling", color: "bg-purple-500" },
];

export default function BodyGraph() {
  const [sensations, setSensations] = useState<Sensation[]>([]);
  const [selectedType, setSelectedType] = useState(sensationTypes[0].value);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all body maps
  const { data: bodyMaps = [] } = useQuery({
    queryKey: ["/api/body-maps"],
  });

  // Create new body map
  const createBodyMap = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/body-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensations,
          emotionalState: notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to save body map");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/body-maps"] });
      setSensations([]);
      setNotes("");
      toast({
        title: "Success",
        description: "Body map saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save body map",
        variant: "destructive",
      });
    },
  });

  const handleBodyClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setSensations([
      ...sensations,
      { x, y, type: selectedType, intensity, notes },
    ]);
  };

  const removeSensation = (index: number) => {
    setSensations(sensations.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Body Graph</h1>
      <p className="text-muted-foreground">
        Map physical sensations and their connection to your emotional state.
        Click on the body diagram to add sensations.
      </p>

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle>Body Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-[1/2]">
              <BodyOutline
                className="absolute inset-0 stroke-2"
                onClick={handleBodyClick}
              />
              {sensations.map((sensation, i) => (
                <div
                  key={i}
                  className={`absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                    sensationTypes.find((t) => t.value === sensation.type)?.color
                  } opacity-${Math.round((sensation.intensity / 10) * 100)}`}
                  style={{
                    left: `${sensation.x}%`,
                    top: `${sensation.y}%`,
                  }}
                  onClick={() => removeSensation(i)}
                  title="Click to remove"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Add Sensation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sensationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <label className="text-sm font-medium">Intensity</label>
                <Slider
                  value={[intensity]}
                  onValueChange={([value]) => setIntensity(value)}
                  min={1}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mild</span>
                  <span>Severe</span>
                </div>
              </div>

              <Textarea
                placeholder="Add notes about your sensations and emotional state..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />

              <Button
                className="w-full"
                onClick={() => createBodyMap.mutate()}
                disabled={sensations.length === 0 || createBodyMap.isPending}
              >
                Save Body Map
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {sensations.map((sensation, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => removeSensation(i)}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    sensationTypes.find((t) => t.value === sensation.type)?.color
                  }`}
                />
                {sensationTypes.find((t) => t.value === sensation.type)?.label} - 
                Intensity: {sensation.intensity}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}