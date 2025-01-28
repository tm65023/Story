import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Helper function to get color based on sensation type
const getSensationColor = (type: string) => {
  switch (type) {
    case "pain":
      return "rgb(239, 68, 68)"; // red-500
    case "tension":
      return "rgb(249, 115, 22)"; // orange-500
    case "numbness":
      return "rgb(59, 130, 246)"; // blue-500
    case "tingling":
      return "rgb(168, 85, 247)"; // purple-500
    default:
      return "rgb(156, 163, 175)"; // gray-400
  }
};

interface StoryStats {
  totalEntries: number;
  totalTags: number;
  mostUsedTags: { name: string; count: number }[];
  entryDates: { date: string; count: number }[];
  bodyGraphCount: number;
  memoryToolCount: number;
  firstEntryDate: string;
  mostActiveDay: {
    day: string;
    count: number;
  };
}

export default function Insights() {
  // Fetch summary stats
  const { data: storyStats } = useQuery<StoryStats>({
    queryKey: ["/api/insights/summary"],
  });

  // Fetch body map patterns
  const { data: bodyMapPatterns } = useQuery({
    queryKey: ["/api/insights/body-maps"],
  });

  // Fetch emotional state patterns
  const { data: emotionalPatterns } = useQuery({
    queryKey: ["/api/insights/emotional-states"],
  });

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Insights & Patterns</h1>
        <p className="text-muted-foreground">
          Discover patterns and trends in your physical and emotional well-being
        </p>
      </div>

      {/* Your Story Section */}
      <Card className="bg-card/50 border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Your Story</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Journal Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {storyStats?.totalEntries || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Since {storyStats?.firstEntryDate ? format(new Date(storyStats.firstEntryDate), 'MMMM d, yyyy') : 'starting'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Most Active Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {storyStats?.mostActiveDay.count || 0} entries
                </div>
                <p className="text-xs text-muted-foreground">
                  on {storyStats?.mostActiveDay.day ? format(new Date(storyStats.mostActiveDay.day), 'MMMM d, yyyy') : 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Body Graph Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {storyStats?.bodyGraphCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Physical sensation records
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Memory Tool Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {storyStats?.memoryToolCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Guided memory explorations
                </p>
              </CardContent>
            </Card>
          </div>

          {storyStats?.entryDates && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Your Journey Timeline</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={storyStats.entryDates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MMM d")}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) =>
                        format(new Date(date), "MMMM d, yyyy")
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {storyStats?.mostUsedTags && storyStats.mostUsedTags.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Most Used Tags</h3>
              <div className="flex flex-wrap gap-2">
                {storyStats.mostUsedTags.map((tag) => (
                  <div
                    key={tag.name}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    {tag.name} ({tag.count})
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Sensation Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sensation Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {bodyMapPatterns?.sensationDistribution && (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bodyMapPatterns.sensationDistribution}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ type, percentage }) =>
                        `${type} (${percentage}%)`
                      }
                    >
                      {bodyMapPatterns.sensationDistribution.map((entry: any) => (
                        <Cell
                          key={entry.type}
                          fill={getSensationColor(entry.type)}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sensation Intensity Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Sensation Intensity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {bodyMapPatterns?.intensityTrends && (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bodyMapPatterns.intensityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MMM d")}
                    />
                    <YAxis domain={[0, 10]} />
                    <Tooltip
                      labelFormatter={(date) =>
                        format(new Date(date), "MMMM d, yyyy")
                      }
                    />
                    {Object.keys(bodyMapPatterns.intensityTrends[0] || {})
                      .filter((key) => key !== "date" && key !== "count" && key !== "dayOfWeek")
                      .map((type) => (
                        <Line
                          key={type}
                          type="monotone"
                          dataKey={type}
                          stroke={getSensationColor(type)}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time-based Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Time of Day Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            {bodyMapPatterns?.timePatterns && (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={Object.entries(bodyMapPatterns.timePatterns).map(
                      ([time, data]: [string, any]) => ({
                        time,
                        ...data.intensities,
                      })
                    )}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="time" />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                    {Object.keys(
                      bodyMapPatterns.timePatterns.morning.intensities
                    ).map((type) => (
                      <Radar
                        key={type}
                        name={type}
                        dataKey={type}
                        stroke={getSensationColor(type)}
                        fill={getSensationColor(type)}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recurring Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Recurring Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bodyMapPatterns?.significantPatterns?.map((pattern: any, index: number) => (
                <div key={index} className="p-4 rounded-lg border bg-card">
                  <h3 className="font-medium mb-2">
                    Pattern occurs {pattern.occurrences} times
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {pattern.sensations.map((s: any, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: `${getSensationColor(s.type)}20`,
                          color: getSensationColor(s.type),
                        }}
                      >
                        {s.type} (intensity: {s.intensity})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emotional State Analysis */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Emotional State Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {emotionalPatterns?.commonPatterns?.map((pattern: any, index: number) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-card"
                >
                  <h3 className="font-medium mb-2">{pattern.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pattern.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}