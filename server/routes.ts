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
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json(safeUsers);
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
    const s = await storage.getSettings();
    res.json({
      resetDay1: s?.resetDay1 ?? null,
      resetDay2: s?.resetDay2 ?? null,
      resetTime: s?.resetTime ?? null,
      lastResetAt: s?.lastResetAt?.toISOString() ?? null,
    });
  });

  app.post(api.admin.updateSettings.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(401);
    const { resetDay1, resetDay2, resetTime } = api.admin.updateSettings.input.parse(req.body);
    const updated = await storage.updateSettings({ resetDay1, resetDay2, resetTime, lastResetAt: null });
    res.json({
      resetDay1: updated.resetDay1 ?? null,
      resetDay2: updated.resetDay2 ?? null,
      resetTime: updated.resetTime ?? null,
      lastResetAt: updated.lastResetAt?.toISOString() ?? null,
    });
  });

  app.get(api.admin.passwords.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(401);
    const allUsers = await storage.getAllUsers();
    const passwordList = allUsers.map(u => ({
      username: u.username,
      password: u.password,
      role: u.role,
      className: u.className || "",
    }));
    res.json(passwordList);
  });

  app.post(api.admin.reset.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(401);
    await storage.resetBookings();
    res.json({ message: "Alle Buchungen wurden zurückgesetzt." });
  });

  // SEED DATA
  await seedDatabase();

  // Auto-reset timer: check every 60 seconds for weekly recurring resets
  // Disabled on Vercel (serverless functions don't support long-running timers)
  // Configure a Vercel Cron Job pointing to /api/cron/reset instead
  if (process.env.VERCEL) return httpServer;
  setInterval(async () => {
    try {
      const s = await storage.getSettings();
      if (!s || s.resetDay1 == null || s.resetDay2 == null || !s.resetTime) return;

      const now = new Date();
      const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
      const currentDay = berlinTime.getDay(); // 0=Sunday, 1=Monday, ...
      const currentTime = `${berlinTime.getHours().toString().padStart(2, '0')}:${berlinTime.getMinutes().toString().padStart(2, '0')}`;

      const isResetDay = currentDay === s.resetDay1 || currentDay === s.resetDay2;
      const isPastTime = currentTime >= s.resetTime;

      if (isResetDay && isPastTime) {
        // Check if already reset today
        if (s.lastResetAt) {
          const lastReset = new Date(new Date(s.lastResetAt).toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
          const sameDay = lastReset.getFullYear() === berlinTime.getFullYear() &&
                          lastReset.getMonth() === berlinTime.getMonth() &&
                          lastReset.getDate() === berlinTime.getDate();
          if (sameDay) return; // Already reset today
        }

        console.log("Weekly auto-reset triggered at", now.toISOString());
        await storage.resetBookings();
        await storage.markResetDone();
      }
    } catch (err) {
      console.error("Auto-reset check failed:", err);
    }
  }, 60000);

  return httpServer;
}

async function seedDatabase() {
  const users = await storage.getAllUsers();
  const existingRooms = await storage.getRooms();
  
  if (existingRooms.length === 0) {
    console.log("Seeding Rooms...");
    await storage.createRoom({ name: "Mathe", teacher: "Haenicke", capacity: 25 });
    await storage.createRoom({ name: "Deutsch", teacher: "Hofer", capacity: 25 });
    await storage.createRoom({ name: "Englisch", teacher: "Wischinski", capacity: 25 });
  }

  if (users.length === 0) {
    console.log("Seeding Users...");

    const teachers = [
      { name: "Hofer, Inka", password: "Adm!9xH#k2Tz" },
      { name: "Haenicke, Sonja", password: "Adm!4vP#q8Nr" },
      { name: "Wischinski", password: "Adm!7bM#x5Jp" },
      { name: "Tewes, Tanja", password: "Adm!2sG#h9Lx" },
      { name: "Bähne, Nils", password: "Adm!5fK#r3Vz" },
      { name: "Langlott, Christian", password: "Adm!8pD#m6Bg" },
      { name: "Benke, Haider", password: "Adm!3nJ#v7Qx" },
    ];

    for (const teacher of teachers) {
      await storage.createUser({
        username: teacher.name,
        password: teacher.password,
        role: "admin",
        className: "Lehrer"
      });
    }

    const students = [
      { name: "Al Saleh, Raman Jamal Hassan", class: "10R2", password: "Px7!k9M#q2Lz" },
      { name: "Albrecht, Anna", class: "10R2", password: "Bv4@n8D*s5Jp" },
      { name: "Amrein, Saphira Juliana", class: "10R2", password: "Rm9!t2G#w7Kx" },
      { name: "Böcker, Fynn", class: "10R2", password: "Lq3@y6H*b4Nc" },
      { name: "Bullerdiek, Lennart Fynn", class: "10R2", password: "Tv8!x5M#p9Zr" },
      { name: "Dürre, Tayler", class: "10R2", password: "Kp2@s7V*m3Fq" },
      { name: "Fiolka, Maya", class: "10R2", password: "Xn6!d9B#h5Wj" },
      { name: "Gorani, Adelina", class: "10R2", password: "Mz5@r2K*t8Gy" },
      { name: "Griebe, Luca Finn", class: "10R2", password: "Yb3!f7J#n4Lv" },
      { name: "Hoppe, Zoe", class: "10R2", password: "Qd9@k4M*w2Px" },
      { name: "Krawzow, Liliana", class: "10R2", password: "Hf5!p8T#s3Bn" },
      { name: "Mela Ali, Amina", class: "10R2", password: "Jn7@t2X*v9Mr" },
      { name: "Melnik, Dennis", class: "10R2", password: "Ck4!z6G#h8Lb" },
      { name: "Önel, Mirxan", class: "10R2", password: "Vm9@n5P*q2Tr" },
      { name: "Rißland, Lukas", class: "10R2", password: "Bc2!w8S#x7Fd" },
      { name: "Salewski, Anthony", class: "10R2", password: "Gy5@t3V*k8Pn" },
      { name: "Skala, Julia", class: "10R2", password: "Nz9!p4H#v2Mj" },
      { name: "Spangenberg, Zaira Maja Josephine", class: "10R2", password: "Xb6@r3K*l7Qw" },
      { name: "Sünnemann, Ole", class: "10R2", password: "Df4!m9X#s2Bt" },
      { name: "Sulek, Tom", class: "10R2", password: "Gw8@n5J*k3Lr" },
      { name: "Teiwes, Lena-Marie", class: "10R2", password: "Vz9!t4P#x7Mk" },
      { name: "Titze, Niclas", class: "10R2", password: "Hb3@s6K*y2Ng" },
      { name: "Wahle, Thilo", class: "10R2", password: "Jp5!d9W#r4Lv" },
      { name: "Weimann, Daniel", class: "10R2", password: "Qx2@t7M*b8Pz" },
      { name: "Zorlu, Nilay", class: "10R2", password: "Sn4!k9H#v3Gr" },
      { name: "Bartels, Ilayda Derya", class: "10R1", password: "Fv7!p2X#m9Kz" },
      { name: "Bartram, Mia", class: "10R1", password: "Lx4@s8B*w5Nd" },
      { name: "Beichert, Maximilian", class: "10R1", password: "Tz9!d4H#v7Mh" },
      { name: "Berauer, Bianka", class: "10R1", password: "Bc3@r6K*l2Px" },
      { name: "Braun, Chris", class: "10R1", password: "Gn8!t5V#m3Jq" },
      { name: "Bullerdiek, Titus Jonah", class: "10R1", password: "Mk6@p9H*x4Rv" },
      { name: "Damm, Sophia", class: "10R1", password: "Dq2!w7S#n5Lf" },
      { name: "Dreißigacker, Briony", class: "10R1", password: "Vz8@t3P*k7Ny" },
      { name: "Hammer, Amy", class: "10R1", password: "Jb5!f9X#s2Mk" },
      { name: "Heine, Fynn", class: "10R1", password: "Qp9@n4H*r7Dz" },
      { name: "Kaiser, Julius", class: "10R1", password: "Xv4!t8M#j3Gn" },
      { name: "Kurylo, Anastasia", class: "10R1", password: "Hf2@s7V*m5Kb" },
      { name: "Mahmoud, Hitham", class: "10R1", password: "Nz9!k4L#p2Tx" },
      { name: "Movsesiants, Elene", class: "10R1", password: "Cw6@v3P*x8Mj" },
      { name: "Nordmann, Adrian", class: "10R1", password: "Rb5!f7J#t4Nq" },
      { name: "Osaj, Justus Timm", class: "10R1", password: "Yd9@p4K*v2Xm" },
      { name: "Parkhomenko, Margarita", class: "10R1", password: "Hb4!t8S#j5Nr" },
      { name: "Petersen, Jule Charlotte", class: "10R1", password: "Jx6@r2M*t9Pv" },
      { name: "Sabsabi, Lana", class: "10R1", password: "Qz9!k4H#v2Ln" },
      { name: "Thomsen, Bjarne", class: "10R1", password: "Tm8@n5J*b3Kx" },
      { name: "Zworski, Moritz Finn", class: "10R1", password: "Fp5!d9X#r2Bt" },
      { name: "Amini, Tamim", class: "10H", password: "Vz9!t4M#x7Pk" },
      { name: "Azimi, Arezo", class: "10H", password: "Hb3@s6G*y2Nd" },
      { name: "Bektasevic, Maida", class: "10H", password: "Jp5!d9W#r4Lv" },
      { name: "Efremidis, Alexis", class: "10H", password: "Qx2@t7M*b8Pz" },
      { name: "Finger, Joyce", class: "10H", password: "Sn4!k9H#v3Gr" },
      { name: "Lebjedzinski, Sophie", class: "10H", password: "Ck2!w8V#m5Nq" },
      { name: "Leikind, Diana", class: "10H", password: "Tz9@p4K*x2Mb" },
      { name: "Mehmedov, Mert", class: "10H", password: "Fv7!n8P#q3Jz" },
      { name: "Mhafel, Adel", class: "10H", password: "Lx4@t5G*b9Nd" },
      { name: "Notthoff, Nijsen", class: "10H", password: "Bv9!f2S#r7Mk" },
      { name: "Notthoff, Nick", class: "10H", password: "Dq3@n8H*v5Px" },
      { name: "Özer, Kartal", class: "10H", password: "Gn7!p4M#k2Tr" },
      { name: "Philipper, Niklas", class: "10H", password: "Hj9@t3V*x8Pn" },
      { name: "Pörtner, Tim Niklas", class: "10H", password: "Kb5!d9S#m2Jv" },
      { name: "Pollack, Kimberly", class: "10H", password: "Nx8@t4P*b3Gy" },
      { name: "Teimori, Asal", class: "10H", password: "Qz2!k9H#v7Lr" },
      { name: "Topper, Jannik", class: "10H", password: "Rb9@n5J*k4Tx" },
      { name: "Vogel, Niklas", class: "10H", password: "Sd4!f7X#m2Bp" },
      { name: "Wirsum, Maxim", class: "10H", password: "Tv8@p3M*w5Nr" },
    ];

    for (const student of students) {
      await storage.createUser({
        username: student.name,
        password: student.password,
        role: "student",
        className: student.class
      });
    }
    console.log("Seeding Complete.");
  }
}
