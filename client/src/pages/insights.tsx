import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
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
import { Brain, Activity, BookHeart } from "lucide-react";

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

  const hasEnoughData = storyStats && (
    storyStats.totalEntries > 5 ||
    storyStats.bodyGraphCount > 3 ||
    storyStats.memoryToolCount > 3
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Your Story</h1>
        <p className="text-muted-foreground">
          A personal journey of memories, feelings, and growth
        </p>
      </div>

      {/* Story Summary Section */}
      <Card className="bg-card/50 border-2">
        <CardHeader>
          <CardTitle className="text-2xl">
            {hasEnoughData ? "Your Journey So Far" : "Start Your Story"}
          </CardTitle>
          <CardDescription>
            {hasEnoughData ? "A collection of your experiences and growth" : "Begin capturing your journey"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasEnoughData ? (
            <>
              <p className="text-lg leading-relaxed">
                Your story began on {format(new Date(storyStats!.firstEntryDate), 'MMMM d, yyyy')}.
                Since then, you've captured {storyStats!.totalEntries} meaningful moments in your journal,
                explored your physical well-being through {storyStats!.bodyGraphCount} body awareness sessions,
                and delved into {storyStats!.memoryToolCount} guided memory explorations.
              </p>
              {storyStats!.mostUsedTags.length > 0 && (
                <p className="text-lg leading-relaxed">
                  Your journey often revolves around themes of{' '}
                  {storyStats!.mostUsedTags
                    .slice(0, 3)
                    .map((tag) => tag.name.toLowerCase())
                    .join(', ')},
                  showing what matters most in your story.
                </p>
              )}
              <p className="text-lg leading-relaxed">
                Your most active day of reflection was {format(new Date(storyStats!.mostActiveDay.day), 'MMMM d')},
                when you added {storyStats!.mostActiveDay.count} entries to your journey.
              </p>
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
            </>
          ) : (
            <div className="space-y-6">
              <p className="text-lg leading-relaxed">
                Your story is waiting to be told. Start capturing your journey through different perspectives:
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Brain className="h-12 w-12 mx-auto text-primary" />
                      <h3 className="font-semibold">Memory Articulation</h3>
                      <p className="text-sm text-muted-foreground">
                        Dive deeper into specific memories and emotions
                      </p>
                      <Link href="/memory-tool">
                        <Button className="w-full">Begin Exercise</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Activity className="h-12 w-12 mx-auto text-primary" />
                      <h3 className="font-semibold">Body Graph</h3>
                      <p className="text-sm text-muted-foreground">
                        Map your physical sensations and body awareness
                      </p>
                      <Link href="/body-graph">
                        <Button className="w-full">Explore Body</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <BookHeart className="h-12 w-12 mx-auto text-primary" />
                      <h3 className="font-semibold">Daily Memories</h3>
                      <p className="text-sm text-muted-foreground">
                        Record your daily thoughts, experiences, and reflections
                      </p>
                      <Link href="/journal">
                        <Button className="w-full">Start Writing</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {hasEnoughData && (
        <>
          <div className="pt-8">
            <h2 className="text-2xl font-bold">Summary</h2>
            <p className="text-muted-foreground">
              Key metrics and milestones from your journey
            </p>
          </div>

          {/* Summary Statistics Cards */}
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
                  Memory Articulations
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

          <div className="pt-8">
            <h2 className="text-2xl font-bold">Insights & Patterns</h2>
            <p className="text-muted-foreground">
              Discover patterns and trends in your physical and emotional well-being
            </p>
          </div>

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

          <div className="pt-8">
            <h2 className="text-2xl font-bold">Historical Analysis</h2>
            <p className="text-muted-foreground">
              Long-term trends and patterns in your journey
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Activity Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Activity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {storyStats?.entryDates && (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={storyStats.entryDates}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => format(new Date(date), "MMM yyyy")}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(date) =>
                            format(new Date(date), "MMMM yyyy")
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
                )}
              </CardContent>
            </Card>

            {/* Tag Usage Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Tag Evolution</CardTitle>
              </CardHeader>
              <CardContent>
                {storyStats?.mostUsedTags && (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={storyStats.mostUsedTags}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {storyStats.mostUsedTags.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={`hsl(${index * 45}, 70%, 50%)`}
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

            {/* Memory Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Memory Depth Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {emotionalPatterns?.commonPatterns && (
                  <div className="space-y-4">
                    {emotionalPatterns.commonPatterns.map((pattern, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border bg-card/50"
                      >
                        <h3 className="font-medium mb-2">{pattern.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pattern.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparative Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                {bodyMapPatterns?.intensityTrends && emotionalPatterns?.commonPatterns && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border bg-card/50">
                      <h3 className="font-medium mb-2">Physical Awareness</h3>
                      <div className="text-3xl font-bold text-primary">
                        {storyStats?.bodyGraphCount || 0}
                        <span className="text-sm text-muted-foreground ml-2">records</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card/50">
                      <h3 className="font-medium mb-2">Emotional Depth</h3>
                      <div className="text-3xl font-bold text-primary">
                        {storyStats?.memoryToolCount || 0}
                        <span className="text-sm text-muted-foreground ml-2">explorations</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}