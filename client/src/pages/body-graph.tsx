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
import { format } from "date-fns";
import { Edit2, Trash2, Plus } from "lucide-react";

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
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number>();
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

  // Load existing body map
  const loadBodyMap = (map: any) => {
    setSensations(map.sensations || []);
    setNotes(map.emotionalState || "");
    setEditingId(map.id);
    setIsCreating(true);
  };

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
      resetForm();
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

  // Update existing body map
  const updateBodyMap = useMutation({
    mutationFn: async () => {
      if (!editingId) return;

      const res = await fetch(`/api/body-maps/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensations,
          emotionalState: notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to update body map");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/body-maps"] });
      resetForm();
      toast({
        title: "Success",
        description: "Body map updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update body map",
        variant: "destructive",
      });
    },
  });

  // Delete body map
  const deleteBodyMap = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/body-maps/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete body map");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/body-maps"] });
      toast({
        title: "Success",
        description: "Body map deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete body map",
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

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(undefined);
    setSensations([]);
    setNotes("");
  };

  const handleSave = () => {
    if (editingId) {
      updateBodyMap.mutate();
    } else {
      createBodyMap.mutate();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Body Graph</h1>
          <p className="text-muted-foreground">
            Map physical sensations and their connection to your emotional state.
            Click on the body diagram to add sensations.
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Body Map
          </Button>
        )}
      </div>

      {isCreating ? (
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

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={
                      sensations.length === 0 ||
                      createBodyMap.isPending ||
                      updateBodyMap.isPending
                    }
                  >
                    {editingId ? "Update" : "Save"} Body Map
                  </Button>
                </div>
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
                  {sensationTypes.find((t) => t.value === sensation.type)?.label} -{" "}
                  Intensity: {sensation.intensity}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bodyMaps.map((map: any) => (
            <Card key={map.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Body Map</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(map.date), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => loadBodyMap(map)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this body map?")) {
                          deleteBodyMap.mutate(map.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative w-full aspect-[1/2]">
                  <BodyOutline className="absolute inset-0 stroke-2" />
                  {map.sensations?.map((sensation: Sensation, i: number) => (
                    <div
                      key={i}
                      className={`absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                        sensationTypes.find((t) => t.value === sensation.type)?.color
                      } opacity-${Math.round((sensation.intensity / 10) * 100)}`}
                      style={{
                        left: `${sensation.x}%`,
                        top: `${sensation.y}%`,
                      }}
                    />
                  ))}
                </div>
                {map.emotionalState && (
                  <p className="mt-4 text-muted-foreground">{map.emotionalState}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}