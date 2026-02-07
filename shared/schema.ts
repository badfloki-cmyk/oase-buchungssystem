import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // 'student' | 'admin'
  className: text("class_name"), // '10H', '10R1', etc.
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'Mathe', 'Deutsch', 'Englisch'
  teacher: text("teacher").notNull(),
  capacity: integer("capacity").notNull().default(25),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  resetDay1: integer("reset_day_1"),
  resetDay2: integer("reset_day_2"),
  resetTime: text("reset_time"),
  lastResetAt: timestamp("last_reset_at"),
});

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertRoomSchema = createInsertSchema(rooms);
export const insertBookingSchema = createInsertSchema(bookings);
export const insertMessageSchema = createInsertSchema(messages);
export const insertSettingsSchema = createInsertSchema(settings);

// Types
export type User = typeof users.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Settings = typeof settings.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
