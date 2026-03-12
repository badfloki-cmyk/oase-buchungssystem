import { db, pool } from "./db";
import { users, rooms, bookings, messages, settings, type User, type InsertUser, type Room, type InsertRoom, type Booking, type InsertBooking, type Message, type InsertMessage, type Settings } from "@shared/schema";
import { eq, count, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>; // For the student dropdown

  // Rooms
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;

  // Bookings
  getBookings(): Promise<(Booking & { user: User, room: Room })[]>;
  getBookingByUserId(userId: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  deleteBooking(id: number): Promise<void>;
  resetBookings(): Promise<void>;
  getRoomOccupancy(roomId: number): Promise<number>;

  // Messages
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, content: string): Promise<Message>;
  deleteMessage(id: number): Promise<void>;

  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(data: { resetDay1: number | null; resetDay2: number | null; resetTime: string | null; lastResetAt?: Date | null }): Promise<Settings>;
  markResetDone(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
     const [newRoom] = await db.insert(rooms).values(room).returning();
     return newRoom;
  }

  async getBookings(): Promise<(Booking & { user: User, room: Room })[]> {
    const rows = await db.select().from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(rooms, eq(bookings.roomId, rooms.id));
    
    return rows.map(row => ({
      ...row.bookings,
      user: row.users,
      room: row.rooms
    }));
  }

  async getBookingByUserId(userId: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.userId, userId));
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async deleteBooking(id: number): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async resetBookings(): Promise<void> {
    await db.delete(bookings);
  }

  async getRoomOccupancy(roomId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(bookings).where(eq(bookings.roomId, roomId));
    return result.count;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async updateMessage(id: number, content: string): Promise<Message> {
    const [updated] = await db.update(messages).set({ content }).where(eq(messages.id, id)).returning();
    return updated;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async getSettings(): Promise<Settings | undefined> {
    const [result] = await db.select().from(settings).limit(1);
    return result;
  }

  async updateSettings(data: { resetDay1: number | null; resetDay2: number | null; resetTime: string | null; lastResetAt?: Date | null }): Promise<Settings> {
    const existing = await this.getSettings();
    if (existing) {
      const [updated] = await db.update(settings).set(data).where(eq(settings.id, existing.id)).returning();
      return updated;
    } else {
      const [inserted] = await db.insert(settings).values(data).returning();
      return inserted;
    }
  }

  async markResetDone(): Promise<void> {
    const existing = await this.getSettings();
    if (existing) {
      await db.update(settings).set({ lastResetAt: new Date() }).where(eq(settings.id, existing.id));
    }
  }
}

export const storage = new DatabaseStorage();
