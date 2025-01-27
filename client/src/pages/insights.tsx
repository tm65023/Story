import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays } from "date-fns";
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

export default function Insights() {
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
                      label={({ type, percent }) =>
                        `${type} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {bodyMapPatterns.sensationDistribution.map((entry) => (
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
                      .filter((key) => key !== "date")
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

        {/* Emotional State Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Emotional State Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            {emotionalPatterns?.commonPatterns?.map((pattern, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <h3 className="font-medium mb-2">{pattern.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {pattern.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
