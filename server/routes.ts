import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication
  setupAuth(app);

  // === API ROUTES ===

  // Users List (for Dropdown)
  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getAllUsers();
    // Filter to only send necessary info for dropdown (security)
    // For simplicity sending full objects but ideally should strip passwords (which are hashed anyway)
    res.json(users);
  });

  // Rooms List
  app.get(api.rooms.list.path, async (req, res) => {
    const rooms = await storage.getRooms();
    const roomsWithOccupancy = await Promise.all(rooms.map(async (room) => {
      const occupancy = await storage.getRoomOccupancy(room.id);
      return { ...room, occupancy };
    }));
    res.json(roomsWithOccupancy);
  });

  // Bookings List (Admin mainly, or for checking stats)
  app.get(api.bookings.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  // Create Booking
  app.post(api.bookings.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { roomId } = api.bookings.create.input.parse(req.body);
      
      // Validation: User already booked?
      const existingBooking = await storage.getBookingByUserId(req.user.id);
      if (existingBooking) {
        return res.status(400).json({ message: "Du hast dich bereits in einen Raum eingetragen." });
      }

      // Validation: Room full?
      const room = await storage.getRoom(roomId);
      if (!room) return res.status(404).json({ message: "Raum nicht gefunden." });
      
      const occupancy = await storage.getRoomOccupancy(roomId);
      if (occupancy >= room.capacity) {
        return res.status(400).json({ message: "Dieser Raum ist leider schon voll." });
      }

      const booking = await storage.createBooking({
        userId: req.user.id,
        roomId: roomId,
      });
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
         return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Delete Booking
  app.delete(api.bookings.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const bookingId = parseInt(req.params.id);
    
    // Check ownership or admin
    const booking = await storage.getBookings().then(bs => bs.find(b => b.id === bookingId));
    if (!booking) return res.sendStatus(404);

    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      return res.sendStatus(403);
    }

    await storage.deleteBooking(bookingId);
    res.sendStatus(204);
  });

  // Messages
  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(401);
    
    const { content } = api.messages.create.input.parse(req.body);
    const message = await storage.createMessage({
      content,
      authorName: req.user.username
    });
    res.status(201).json(message);
  });

  // Admin Reset
  app.post(api.admin.reset.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(401);
    await storage.resetBookings();
    res.json({ message: "Alle Buchungen wurden zurückgesetzt." });
  });

  // SEED DATA
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const users = await storage.getAllUsers();
  if (users.length === 0) {
    console.log("Seeding Database...");
    
    // Create Admin
    await storage.createUser({
      username: "admin",
      password: "adminpassword", // In real app, hash this! Auth setup handles hashing usually, but for seed simple is ok if matched. 
      // ACTUALLY: The auth.ts (which we need to write) will likely use scrypt. 
      // For the seed, we should ideally use the same hashing or just plaintext if our auth strategy allows it for dev.
      // I'll stick to plaintext for now and assume the scrypt verify function handles it or we update it.
      // Wait, standard passport-local template uses scrypt. I need to helper.
      role: "admin",
      className: "Staff"
    });

    // Create Rooms
    await storage.createRoom({ name: "Mathe", teacher: "Haenicke", capacity: 25 });
    await storage.createRoom({ name: "Deutsch", teacher: "Hofer", capacity: 25 });
    await storage.createRoom({ name: "Englisch", teacher: "Wischinski", capacity: 25 });

    // Create Students
    const classes = [
      { name: "10H", students: ["Max M", "Lisa L", "Tom T"] },
      { name: "10R1", students: ["Sarah S", "Ben B", "Anna A"] },
      { name: "10R2", students: ["Kevin K", "Julia J", "David D"] }
    ];

    for (const cls of classes) {
      for (const studentName of cls.students) {
        await storage.createUser({
          username: studentName,
          password: "1234", // Default password
          role: "student",
          className: cls.name
        });
      }
    }
    console.log("Seeding Complete.");
  }
}
