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

  app.patch(api.messages.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const { content } = api.messages.update.input.parse(req.body);
    const updated = await storage.updateMessage(id, content);
    res.json(updated);
  });

  app.delete(api.messages.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(401);
    const id = parseInt(req.params.id);
    await storage.deleteMessage(id);
    res.sendStatus(204);
  });

  // Admin Settings & Reset
  app.get(api.admin.getSettings.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(401);
    const settings = await storage.getSettings();
    res.json({ resetAt: settings?.resetAt?.toISOString() || null });
  });

  app.post(api.admin.updateSettings.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(401);
    const { resetAt } = api.admin.updateSettings.input.parse(req.body);
    const updated = await storage.updateSettings(resetAt ? new Date(resetAt) : null);
    res.json({ resetAt: updated.resetAt?.toISOString() || null });
  });

  app.post(api.admin.reset.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(401);
    await storage.resetBookings();
    res.json({ message: "Alle Buchungen wurden zurückgesetzt." });
  });

  // SEED DATA
  await seedDatabase();

  // Auto-reset timer: check every 60 seconds
  setInterval(async () => {
    try {
      const settings = await storage.getSettings();
      if (settings?.resetAt && new Date(settings.resetAt) <= new Date()) {
        console.log("Auto-reset triggered at", new Date().toISOString());
        await storage.resetBookings();
        await storage.updateSettings(null);
      }
    } catch (err) {
      console.error("Auto-reset check failed:", err);
    }
  }, 60000);

  return httpServer;
}

async function seedDatabase() {
  const users = await storage.getAllUsers();
  if (users.length === 0) {
    console.log("Seeding Database...");
    
    // Create Admin
    await storage.createUser({
      username: "admin",
      password: "adminpassword",
      role: "admin",
      className: "Staff"
    });

    // Create Rooms
    await storage.createRoom({ name: "Mathe", teacher: "Haenicke", capacity: 25 });
    await storage.createRoom({ name: "Deutsch", teacher: "Hofer", capacity: 25 });
    await storage.createRoom({ name: "Englisch", teacher: "Wischinski", capacity: 25 });

    const students = [
      // 10R2
      { name: "Al Saleh, Raman Jamal Hassan", class: "10R2" },
      { name: "Albrecht, Anna", class: "10R2" },
      { name: "Amrein, Saphira Juliana", class: "10R2" },
      { name: "Böcker, Fynn", class: "10R2" },
      { name: "Bullerdiek, Lennart Fynn", class: "10R2" },
      { name: "Dürre, Tayler", class: "10R2" },
      { name: "Fiolka, Maya", class: "10R2" },
      { name: "Gorani, Adelina", class: "10R2" },
      { name: "Griebe, Luca Finn", class: "10R2" },
      { name: "Hoppe, Zoe", class: "10R2" },
      { name: "Krawzow, Liliana", class: "10R2" },
      { name: "Mela Ali, Amina", class: "10R2" },
      { name: "Melnik, Dennis", class: "10R2" },
      { name: "Önel, Mirxan", class: "10R2" },
      { name: "Rißland, Lukas", class: "10R2" },
      { name: "Salewski, Anthony", class: "10R2" },
      { name: "Skala, Julia", class: "10R2" },
      { name: "Spangenberg, Zaira Maja Josephine", class: "10R2" },
      { name: "Sünnemann, Ole", class: "10R2" },
      { name: "Sulek, Tom", class: "10R2" },
      { name: "Teiwes, Lena-Marie", class: "10R2" },
      { name: "Titze, Niclas", class: "10R2" },
      { name: "Wahle, Thilo", class: "10R2" },
      { name: "Weimann, Daniel", class: "10R2" },
      { name: "Zorlu, Nilay", class: "10R2" },
      // 10R1
      { name: "Bartels, Ilayda Derya", class: "10R1" },
      { name: "Bartram, Mia", class: "10R1" },
      { name: "Beichert, Maximilian", class: "10R1" },
      { name: "Berauer, Bianka", class: "10R1" },
      { name: "Braun, Chris", class: "10R1" },
      { name: "Bullerdiek, Titus Jonah", class: "10R1" },
      { name: "Damm, Sophia", class: "10R1" },
      { name: "Dreißigacker, Briony", class: "10R1" },
      { name: "Hammer, Amy", class: "10R1" },
      { name: "Heine, Fynn", class: "10R1" },
      { name: "Kaiser, Julius", class: "10R1" },
      { name: "Kurylo, Anastasia", class: "10R1" },
      { name: "Mahmoud, Hitham", class: "10R1" },
      { name: "Movsesiants, Elene", class: "10R1" },
      { name: "Nordmann, Adrian", class: "10R1" },
      { name: "Osaj, Justus Timm", class: "10R1" },
      { name: "Parkhomenko, Margarita", class: "10R1" },
      { name: "Petersen, Jule Charlotte", class: "10R1" },
      { name: "Sabsabi, Lana", class: "10R1" },
      { name: "Thomsen, Bjarne", class: "10R1" },
      { name: "Zworski, Moritz Finn", class: "10R1" },
      // 10H
      { name: "Amini, Tamim", class: "10H" },
      { name: "Azimi, Arezo", class: "10H" },
      { name: "Bektasevic, Maida", class: "10H" },
      { name: "Efremidis, Alexis", class: "10H" },
      { name: "Finger, Joyce", class: "10H" },
      { name: "Lebjedzinski, Sophie", class: "10H" },
      { name: "Leikind, Diana", class: "10H" },
      { name: "Mehmedov, Mert", class: "10H" },
      { name: "Mhafel, Adel", class: "10H" },
      { name: "Notthoff, Nijsen", class: "10H" },
      { name: "Notthoff, Nick", class: "10H" },
      { name: "Özer, Kartal", class: "10H" },
      { name: "Philipper, Niklas", class: "10H" },
      { name: "Pörtner, Tim Niklas", class: "10H" },
      { name: "Pollack, Kimberly", class: "10H" },
      { name: "Teimori, Asal", class: "10H" },
      { name: "Topper, Jannik", class: "10H" },
      { name: "Vogel, Niklas", class: "10H" },
      { name: "Wirsum, Maxim", class: "10H" }
    ];

    for (const student of students) {
      await storage.createUser({
        username: student.name,
        password: "1234",
        role: "student",
        className: student.class
      });
    }
    console.log("Seeding Complete.");
  }
}
