import { z } from 'zod';
import { insertUserSchema, insertBookingSchema, insertMessageSchema, users, rooms, bookings, messages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    user: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
  },
  rooms: {
    list: {
      method: 'GET' as const,
      path: '/api/rooms' as const,
      responses: {
        200: z.array(z.object({
          id: z.number(),
          name: z.string(),
          teacher: z.string(),
          capacity: z.number(),
          occupancy: z.number(), // Computed field
        })),
      },
    },
  },
  bookings: {
    list: {
      method: 'GET' as const,
      path: '/api/bookings' as const,
      responses: {
        200: z.array(z.object({
          id: z.number(),
          userId: z.number(),
          roomId: z.number(),
          createdAt: z.string(),
          user: z.custom<typeof users.$inferSelect>(),
          room: z.custom<typeof rooms.$inferSelect>(),
        })),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/bookings' as const,
      input: z.object({
        roomId: z.number(),
      }),
      responses: {
        201: z.custom<typeof bookings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/bookings/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages' as const,
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/messages' as const,
      input: z.object({
        content: z.string().min(1),
      }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/messages/:id' as const,
      input: z.object({
        content: z.string().min(1),
      }),
      responses: {
        200: z.custom<typeof messages.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/messages/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  admin: {
    reset: {
      method: 'POST' as const,
      path: '/api/admin/reset' as const,
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    getSettings: {
      method: 'GET' as const,
      path: '/api/admin/settings' as const,
      responses: {
        200: z.object({ resetAt: z.string().nullable() }),
        401: errorSchemas.unauthorized,
      },
    },
    updateSettings: {
      method: 'POST' as const,
      path: '/api/admin/settings' as const,
      input: z.object({
        resetAt: z.string().nullable(),
      }),
      responses: {
        200: z.object({ resetAt: z.string().nullable() }),
        401: errorSchemas.unauthorized,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
