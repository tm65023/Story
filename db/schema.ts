import { pgTable, text, serial, timestamp, integer, json, boolean } from "drizzle-orm/pg-core";
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
  userId: integer("user_id"),
});

// User Authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isVerified: boolean("is_verified").notNull().default(false),
});

// OTP Storage for Email Verification
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  type: text("type").notNull(), // 'signup' or 'login'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Memory Articulation Tool
export const memoryEntries = pgTable("memory_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  aiSummary: text("ai_summary"),
  metadata: text("metadata"), // Store AI interaction data
  emotionalTags: text("emotional_tags"), // Array of emotional markers
  date: timestamp("date").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  userId: integer("user_id"),
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
  userId: integer("user_id"),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const entryTags = pgTable("entry_tags", {
  entryId: integer("entry_id").notNull().references(() => entries.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
});

// Relations
export const entryRelations = relations(entries, ({ many, one }) => ({
  entryTags: many(entryTags),
  user: one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
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
  user: one(users, {
    fields: [bodyMaps.userId],
    references: [users.id],
  }),
}));

export const otpRelations = relations(otps, ({ one }) => ({
  user: one(users, {
    fields: [otps.userId],
    references: [users.id],
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
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertOtpSchema = createInsertSchema(otps);
export const selectOtpSchema = createSelectSchema(otps);

// Types
export type Entry = typeof entries.$inferSelect;
export type InsertEntry = typeof entries.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type MemoryEntry = typeof memoryEntries.$inferSelect;
export type InsertMemoryEntry = typeof memoryEntries.$inferInsert;
export type BodyMap = typeof bodyMaps.$inferSelect;
export type InsertBodyMap = typeof bodyMaps.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type OTP = typeof otps.$inferSelect;
export type InsertOTP = typeof otps.$inferInsert;