import { pgTable, text, serial, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Daily Moment Tracker
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  imageUrl: text("image_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Memory Articulation Tool
export const memoryEntries = pgTable("memory_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  aiSummary: text("ai_summary"),
  metadata: json("metadata"), // Store AI interaction data
  emotionalTags: json("emotional_tags"), // Array of emotional markers
  date: timestamp("date").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Body Graph
export const bodyMaps = pgTable("body_maps", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  sensations: json("sensations"), // Array of {area, intensity, type}
  emotionalState: text("emotional_state"),
  notes: text("notes"),
  relatedMemoryId: integer("related_memory_id").references(() => memoryEntries.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const entryTags = pgTable("entry_tags", {
  entryId: integer("entry_id").notNull().references(() => entries.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
});

// Story Exports
export const storyExports = pgTable("story_exports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  timeRange: integer("time_range").notNull(),
  entriesCount: integer("entries_count").notNull(),
  dateRange: text("date_range").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const entryRelations = relations(entries, ({ many }) => ({
  entryTags: many(entryTags),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  entryTags: many(entryTags),
}));

export const entryTagsRelations = relations(entryTags, ({ one }) => ({
  entry: one(entries, {
    fields: [entryTags.entryId],
    references: [entries.id],
  }),
  tag: one(tags, {
    fields: [entryTags.tagId],
    references: [tags.id],
  }),
}));

export const bodyMapRelations = relations(bodyMaps, ({ one }) => ({
  memoryEntry: one(memoryEntries, {
    fields: [bodyMaps.relatedMemoryId],
    references: [memoryEntries.id],
  }),
}));

// Schemas
export const insertEntrySchema = createInsertSchema(entries);
export const selectEntrySchema = createSelectSchema(entries);
export const insertTagSchema = createInsertSchema(tags);
export const selectTagSchema = createSelectSchema(tags);
export const insertMemoryEntrySchema = createInsertSchema(memoryEntries);
export const selectMemoryEntrySchema = createSelectSchema(memoryEntries);
export const insertBodyMapSchema = createInsertSchema(bodyMaps);
export const selectBodyMapSchema = createSelectSchema(bodyMaps);

// Export schemas
export const insertStoryExportSchema = createInsertSchema(storyExports);
export const selectStoryExportSchema = createSelectSchema(storyExports);

// Types
export type Entry = typeof entries.$inferSelect;
export type InsertEntry = typeof entries.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type MemoryEntry = typeof memoryEntries.$inferSelect;
export type InsertMemoryEntry = typeof memoryEntries.$inferInsert;
export type BodyMap = typeof bodyMaps.$inferSelect;
export type InsertBodyMap = typeof bodyMaps.$inferInsert;
export type StoryExport = typeof storyExports.$inferSelect;
export type InsertStoryExport = typeof storyExports.$inferInsert;