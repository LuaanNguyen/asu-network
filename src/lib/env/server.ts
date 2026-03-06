import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url().optional(),
  RATE_LIMIT_SALT: z.string().min(8).optional(),
  ADMIN_TOKEN: z.string().min(16).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export const env = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT,
  ADMIN_TOKEN: process.env.ADMIN_TOKEN,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
