import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { entries, tags, entryTags, bodyMaps } from "@db/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Get all entries
  app.get("/api/entries", async (_req, res) => {
    const result = await db.query.entries.findMany({
      orderBy: desc(entries.date),
      with: {
        entryTags: {
          with: {
            tag: true,
          },
        },
      },
    });
    res.json(result);
  });

  // Get single entry
  app.get("/api/entries/:id", async (req, res) => {
    const entry = await db.query.entries.findFirst({
      where: eq(entries.id, parseInt(req.params.id)),
      with: {
        entryTags: {
          with: {
            tag: true,
          },
        },
      },
    });
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json(entry);
  });

  // Create entry
  app.post("/api/entries", async (req, res) => {
    const { title, content, imageUrl, tags: tagNames } = req.body;

    const entry = await db.transaction(async (tx) => {
      const [newEntry] = await tx.insert(entries).values({
        title,
        content,
        imageUrl,
      }).returning();

      if (tagNames?.length) {
        const existingTags = await tx.query.tags.findMany({
          where: (tags) => tags.name.in(tagNames),
        });

        const existingTagNames = new Set(existingTags.map(t => t.name));
        const newTagNames = tagNames.filter(name => !existingTagNames.has(name));

        if (newTagNames.length) {
          const newTags = await tx.insert(tags)
            .values(newTagNames.map(name => ({ name })))
            .returning();
          existingTags.push(...newTags);
        }

        await tx.insert(entryTags).values(
          existingTags.map(tag => ({
            entryId: newEntry.id,
            tagId: tag.id,
          }))
        );
      }

      return newEntry;
    });

    res.json(entry);
  });

  // Update entry
  app.put("/api/entries/:id", async (req, res) => {
    const { title, content, imageUrl, tags: tagNames } = req.body;

    const entry = await db.transaction(async (tx) => {
      const [updatedEntry] = await tx.update(entries)
        .set({
          title,
          content,
          imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(entries.id, parseInt(req.params.id)))
        .returning();

      if (!updatedEntry) {
        throw new Error("Entry not found");
      }

      await tx.delete(entryTags)
        .where(eq(entryTags.entryId, updatedEntry.id));

      if (tagNames?.length) {
        const existingTags = await tx.query.tags.findMany({
          where: (tags) => tags.name.in(tagNames),
        });

        const existingTagNames = new Set(existingTags.map(t => t.name));
        const newTagNames = tagNames.filter(name => !existingTagNames.has(name));

        if (newTagNames.length) {
          const newTags = await tx.insert(tags)
            .values(newTagNames.map(name => ({ name })))
            .returning();
          existingTags.push(...newTags);
        }

        await tx.insert(entryTags).values(
          existingTags.map(tag => ({
            entryId: updatedEntry.id,
            tagId: tag.id,
          }))
        );
      }

      return updatedEntry;
    });

    res.json(entry);
  });

  // Delete entry
  app.delete("/api/entries/:id", async (req, res) => {
    await db.transaction(async (tx) => {
      await tx.delete(entryTags)
        .where(eq(entryTags.entryId, parseInt(req.params.id)));
      await tx.delete(entries)
        .where(eq(entries.id, parseInt(req.params.id)));
    });
    res.status(204).end();
  });

  // Search entries
  app.get("/api/search", async (req, res) => {
    const { q, tag } = req.query;

    const results = await db.query.entries.findMany({
      where: tag
        ? and(
            like(entries.content, `%${q}%`),
            entries.id.in(
              db.select({ id: entryTags.entryId })
                .from(entryTags)
                .innerJoin(tags, eq(tags.id, entryTags.tagId))
                .where(eq(tags.name, tag as string))
            )
          )
        : like(entries.content, `%${q}%`),
      orderBy: desc(entries.date),
      with: {
        entryTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    res.json(results);
  });

  // Body Maps CRUD Operations
  app.get("/api/body-maps", async (_req, res) => {
    const maps = await db.query.bodyMaps.findMany({
      orderBy: desc(bodyMaps.date),
    });
    res.json(maps);
  });

  app.get("/api/body-maps/:id", async (req, res) => {
    const map = await db.query.bodyMaps.findFirst({
      where: eq(bodyMaps.id, parseInt(req.params.id)),
    });
    if (!map) return res.status(404).json({ message: "Body map not found" });
    res.json(map);
  });

  app.post("/api/body-maps", async (req, res) => {
    const { sensations, emotionalState, notes, relatedMemoryId } = req.body;

    const [newMap] = await db.insert(bodyMaps)
      .values({
        sensations,
        emotionalState,
        notes,
        relatedMemoryId,
      })
      .returning();

    res.json(newMap);
  });

  app.put("/api/body-maps/:id", async (req, res) => {
    const { sensations, emotionalState, notes, relatedMemoryId } = req.body;

    const [updatedMap] = await db.update(bodyMaps)
      .set({
        sensations,
        emotionalState,
        notes,
        relatedMemoryId,
        updatedAt: new Date(),
      })
      .where(eq(bodyMaps.id, parseInt(req.params.id)))
      .returning();

    if (!updatedMap) {
      return res.status(404).json({ message: "Body map not found" });
    }

    res.json(updatedMap);
  });

  app.delete("/api/body-maps/:id", async (req, res) => {
    await db.delete(bodyMaps)
      .where(eq(bodyMaps.id, parseInt(req.params.id)));
    res.status(204).end();
  });

  // Enhanced Pattern Recognition & Insights
  app.get("/api/insights/body-maps", async (_req, res) => {
    const maps = await db.query.bodyMaps.findMany({
      orderBy: desc(bodyMaps.date),
      with: {
        memoryEntry: true,
      },
    });

    // Calculate sensation distribution
    const sensationCounts: Record<string, number> = {};
    let totalSensations = 0;

    maps.forEach((map) => {
      if (map.sensations) {
        const sensations = map.sensations as any[];
        sensations.forEach((sensation) => {
          sensationCounts[sensation.type] = (sensationCounts[sensation.type] || 0) + 1;
          totalSensations++;
        });
      }
    });

    const sensationDistribution = Object.entries(sensationCounts).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / totalSensations) * 100).toFixed(1) + '%',
    }));

    // Calculate intensity trends with time context
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, "yyyy-MM-dd"),
        pain: 0,
        tension: 0,
        numbness: 0,
        tingling: 0,
        count: 0,
        dayOfWeek: format(date, "EEEE"),
      };
    }).reverse();

    const intensityTrends = new Map(last30Days.map(day => [day.date, { ...day }]));

    // Track patterns by time of day
    const timePatterns = {
      morning: { count: 0, intensities: {} as Record<string, number> },
      afternoon: { count: 0, intensities: {} as Record<string, number> },
      evening: { count: 0, intensities: {} as Record<string, number> },
    };

    maps.forEach((map) => {
      if (map.sensations) {
        const date = format(new Date(map.date), "yyyy-MM-dd");
        const hour = new Date(map.date).getHours();
        const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
        const dayData = intensityTrends.get(date);

        if (dayData) {
          const sensations = map.sensations as any[];
          sensations.forEach((sensation) => {
            dayData[sensation.type] = (dayData[sensation.type] * dayData.count + sensation.intensity) / (dayData.count + 1);

            // Track time-based patterns
            timePatterns[timeOfDay].count++;
            timePatterns[timeOfDay].intensities[sensation.type] =
              (timePatterns[timeOfDay].intensities[sensation.type] || 0) + sensation.intensity;
          });
          dayData.count++;
        }
      }
    });

    // Calculate recurring patterns
    const recurringPatterns = maps.reduce((patterns, map) => {
      if (map.sensations) {
        const sensations = map.sensations as any[];
        const key = sensations
          .map(s => `${s.type}-${Math.round(s.intensity)}`)
          .sort()
          .join('|');

        patterns[key] = (patterns[key] || 0) + 1;
        return patterns;
      }
      return patterns;
    }, {} as Record<string, number>);

    // Find significant patterns (occurring more than once)
    const significantPatterns = Object.entries(recurringPatterns)
      .filter(([, count]) => count > 1)
      .map(([pattern, count]) => ({
        sensations: pattern.split('|').map(p => {
          const [type, intensity] = p.split('-');
          return { type, intensity: Number(intensity) };
        }),
        occurrences: count,
      }));

    // Calculate average intensities by time of day
    Object.keys(timePatterns).forEach(timeOfDay => {
      const { count, intensities } = timePatterns[timeOfDay];
      if (count > 0) {
        Object.keys(intensities).forEach(type => {
          intensities[type] = Number((intensities[type] / count).toFixed(1));
        });
      }
    });

    res.json({
      sensationDistribution,
      intensityTrends: Array.from(intensityTrends.values()),
      timePatterns,
      significantPatterns,
    });
  });

  app.get("/api/insights/emotional-states", async (_req, res) => {
    const maps = await db.query.bodyMaps.findMany({
      orderBy: desc(bodyMaps.date),
      with: {
        memoryEntry: true,
      },
    });

    // Analyze emotional states
    const emotionalPatterns = [];
    const emotionalStates = maps
      .filter(map => map.emotionalState)
      .map(map => ({
        state: map.emotionalState as string,
        date: map.date,
        sensations: map.sensations as any[],
      }));

    if (emotionalStates.length > 0) {
      // Find common words/phrases
      const words = emotionalStates
        .map(e => e.state.toLowerCase())
        .join(" ")
        .split(/\W+/);

      const wordFrequency: Record<string, number> = {};
      const commonEmotions = [
        "anxious", "calm", "stressed", "relaxed", "happy",
        "sad", "angry", "peaceful", "worried", "content"
      ];

      words.forEach(word => {
        if (word.length > 3 || commonEmotions.includes(word)) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });

      const commonWords = Object.entries(wordFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      emotionalPatterns.push({
        title: "Common Emotional Themes",
        description: `Your most frequently expressed emotional states are: ${
          commonWords.map(([word, count]) => `${word} (${count} times)`).join(", ")
        }.`,
      });

      // Analyze sensation-emotion correlations
      const correlations: Record<string, Record<string, number>> = {};
      emotionalStates.forEach(({ state, sensations = [] }) => {
        const emotions = state.toLowerCase().split(/\W+/).filter(w => commonEmotions.includes(w));

        emotions.forEach(emotion => {
          if (!correlations[emotion]) correlations[emotion] = {};

          sensations.forEach(sensation => {
            correlations[emotion][sensation.type] =
              (correlations[emotion][sensation.type] || 0) + 1;
          });
        });
      });

      // Find significant correlations
      const significantCorrelations = Object.entries(correlations)
        .map(([emotion, sensations]) => ({
          emotion,
          correlations: Object.entries(sensations)
            .map(([sensation, count]) => ({
              sensation,
              strength: (count / emotionalStates.length * 100).toFixed(1) + '%',
            }))
            .filter(c => parseFloat(c.strength) > 20) // Only show strong correlations
            .sort((a, b) => parseFloat(b.strength) - parseFloat(a.strength)),
        }))
        .filter(c => c.correlations.length > 0);

      if (significantCorrelations.length > 0) {
        emotionalPatterns.push({
          title: "Emotion-Sensation Correlations",
          description: significantCorrelations
            .map(c => `When feeling ${c.emotion}, you often experience ${
              c.correlations.map(corr => `${corr.sensation} (${corr.strength})`).join(", ")
            }`)
            .join(". "),
        });
      }
    }

    res.json({
      commonPatterns: emotionalPatterns,
    });
  });

  // Development endpoint to generate sample data
  app.post("/api/dev/generate-sample-data", async (_req, res) => {
    try {
      const emotions = [
        "feeling anxious and tense",
        "calm and centered today",
        "stressed about work",
        "peaceful after meditation",
        "happy and energetic",
        "sad and low energy",
        "worried about upcoming events",
        "content and relaxed"
      ];

      const sampleData = [];

      // Generate 30 days of data with multiple entries per day
      for (let i = 0; i < 30; i++) {
        const date = subDays(new Date(), i);

        // Create 1-3 entries per day
        const entriesCount = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < entriesCount; j++) {
          // Vary the hour to distribute across morning/afternoon/evening
          const hour = Math.floor(Math.random() * 24);
          const entryDate = new Date(date.setHours(hour));

          // Create recurring patterns by using similar sensation combinations
          const sensations = [];

          if (i % 3 === 0) {
            // Pattern 1: Stress pattern
            sensations.push(
              { type: "tension", intensity: 7 + Math.random() * 3, x: 30, y: 20 },
              { type: "pain", intensity: 5 + Math.random() * 3, x: 50, y: 30 }
            );
          } else if (i % 3 === 1) {
            // Pattern 2: Anxiety pattern
            sensations.push(
              { type: "tingling", intensity: 6 + Math.random() * 3, x: 40, y: 40 },
              { type: "tension", intensity: 8 + Math.random() * 2, x: 45, y: 45 }
            );
          } else {
            // Pattern 3: Relaxation pattern
            sensations.push(
              { type: "numbness", intensity: 3 + Math.random() * 2, x: 60, y: 50 },
              { type: "tingling", intensity: 2 + Math.random() * 2, x: 55, y: 55 }
            );
          }

          // Add some random variations to make the data more realistic
          if (Math.random() > 0.7) {
            sensations.push({
              type: ["pain", "tension", "numbness", "tingling"][Math.floor(Math.random() * 4)],
              intensity: Math.random() * 10,
              x: Math.random() * 100,
              y: Math.random() * 100
            });
          }

          sampleData.push({
            date: entryDate,
            sensations,
            emotionalState: emotions[Math.floor(Math.random() * emotions.length)],
            notes: "Sample data entry"
          });
        }
      }

      // Insert the sample data
      await db.insert(bodyMaps).values(sampleData);

      res.json({ message: "Sample data generated successfully", count: sampleData.length });
    } catch (error) {
      console.error("Error generating sample data:", error);
      res.status(500).json({ message: "Failed to generate sample data" });
    }
  });

  return httpServer;
}