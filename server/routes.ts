import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { entries, tags, entryTags, bodyMaps } from "@db/schema";
import { eq, and, desc, like } from "drizzle-orm";
import { format, subDays } from "date-fns";

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

  // Pattern Recognition & Insights
  app.get("/api/insights/body-maps", async (_req, res) => {
    const maps = await db.query.bodyMaps.findMany({
      orderBy: desc(bodyMaps.date),
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
    }));

    // Calculate intensity trends over time
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, "yyyy-MM-dd"),
        pain: 0,
        tension: 0,
        numbness: 0,
        tingling: 0,
        count: 0,
      };
    }).reverse();

    const intensityTrends = new Map(last30Days.map(day => [day.date, { ...day }]));

    maps.forEach((map) => {
      if (map.sensations) {
        const date = format(new Date(map.date), "yyyy-MM-dd");
        const dayData = intensityTrends.get(date);

        if (dayData) {
          const sensations = map.sensations as any[];
          sensations.forEach((sensation) => {
            dayData[sensation.type] = (dayData[sensation.type] * dayData.count + sensation.intensity) / (dayData.count + 1);
            dayData.count++;
          });
        }
      }
    });

    res.json({
      sensationDistribution,
      intensityTrends: Array.from(intensityTrends.values()),
    });
  });

  app.get("/api/insights/emotional-states", async (_req, res) => {
    const maps = await db.query.bodyMaps.findMany({
      orderBy: desc(bodyMaps.date),
    });

    // Analyze emotional states
    const emotionalPatterns = [];
    const emotionalStates = maps.map(map => map.emotionalState).filter(Boolean);

    if (emotionalStates.length > 0) {
      // Find common words/phrases
      const words = emotionalStates.join(" ").toLowerCase().split(/\W+/);
      const wordFrequency: Record<string, number> = {};

      words.forEach(word => {
        if (word.length > 3) { // Filter out short words
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });

      const commonWords = Object.entries(wordFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      emotionalPatterns.push({
        title: "Common Emotional Themes",
        description: `Your most frequently mentioned emotional themes are: ${
          commonWords.map(([word]) => word).join(", ")
        }.`,
      });
    }

    res.json({
      commonPatterns: emotionalPatterns,
    });
  });

  return httpServer;
}