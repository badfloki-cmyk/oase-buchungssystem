# OASE Buchungssystem (Room Booking System)

## Overview

This is a room booking system ("Fit für den Abschluss") for a German school (Ernst-Reuter-Schule). Students can log in, select a room (Mathe, Deutsch, Englisch), and book a spot. Teachers/admins can manage bookings, post announcements, and reset the database on a schedule. The app is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library (New York style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming; custom pink/warm color scheme with Fredoka (display) and Nunito (body) fonts
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend
- **Framework**: Express 5 running on Node.js with TypeScript (tsx for development)
- **Authentication**: Passport.js with Local Strategy, express-session backed by PostgreSQL session store (connect-pg-simple)
- **Password Hashing**: Node.js crypto (scrypt) with salt; includes plaintext fallback for seed data
- **API Design**: RESTful JSON API under `/api/` prefix, with shared route definitions and Zod validation schemas in `shared/routes.ts`

### Shared Layer (`shared/`)
- **Schema** (`shared/schema.ts`): Drizzle ORM table definitions for `users`, `rooms`, `bookings`, `messages`, and `settings`. Uses `drizzle-zod` for insert schema generation.
- **Routes** (`shared/routes.ts`): Centralized API route definitions with paths, methods, input/output Zod schemas — shared between client and server for type safety.

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **Session Store**: PostgreSQL-backed via connect-pg-simple (auto-creates table)
- **Schema Push**: Use `npm run db:push` (drizzle-kit push) to sync schema to database
- **Key Tables**:
  - `users` — id, username, password (hashed), role (student/admin), className
  - `rooms` — id, name, teacher, capacity (default 25)
  - `bookings` — id, userId (FK→users), roomId (FK→rooms), createdAt
  - `messages` — id, content, authorName, createdAt
  - `settings` — id, resetDay1 (int, day of week 0-6), resetDay2 (int), resetTime (text "HH:MM"), lastResetAt (timestamp) — for weekly recurring resets on 2 days

### Storage Pattern
- `server/storage.ts` defines an `IStorage` interface and `DatabaseStorage` implementation
- All database operations go through the storage layer, making it easy to swap implementations

### Build & Development
- **Dev**: `npm run dev` — runs tsx with Vite dev server middleware (HMR on `/vite-hmr`)
- **Build**: `npm run build` — Vite builds the client to `dist/public`, esbuild bundles the server to `dist/index.cjs`
- **Production**: `npm start` — serves the built app with Express static file serving
- **Type Check**: `npm run check`

### Key Pages
- `/` — Login page with tabs for student (dropdown selector) and admin (username/password) login
- `/dashboard` — Student dashboard showing available rooms, booking status, and announcements
- `/admin/dashboard` — Admin dashboard with booking management table, message posting, and database reset controls

### Role-Based Access
- Two roles: `student` and `admin`
- Protected routes redirect unauthenticated users to login
- Admin-only routes check for `role === "admin"`

## External Dependencies

- **PostgreSQL**: Required. Must be provisioned and connection string set as `DATABASE_URL` environment variable
- **Session Secret**: Uses `SESSION_SECRET` env var (falls back to a default for development)
- **Fonts**: Google Fonts (Fredoka, Nunito, DM Sans, Fira Code, Geist Mono, Architects Daughter) loaded via CDN
- **Replit Plugins**: Vite plugins for runtime error overlay, cartographer, and dev banner (development only, when `REPL_ID` is set)
- **No external auth providers**: Authentication is fully self-contained with local username/password strategy