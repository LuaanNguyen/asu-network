import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url().optional(),
  RATE_LIMIT_SALT: z.string().min(8).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  ADMIN_ALLOWED_EMAILS: z.string().min(1).optional(),
  AUTH_ENABLE_TEST_PROVIDER: z
    .enum(["0", "1", "true", "false"])
    .optional(),
  AUTH_TEST_PASSWORD: z.string().min(8).optional(),
});

export const env = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  ADMIN_ALLOWED_EMAILS: process.env.ADMIN_ALLOWED_EMAILS,
  AUTH_ENABLE_TEST_PROVIDER: process.env.AUTH_ENABLE_TEST_PROVIDER,
  AUTH_TEST_PASSWORD: process.env.AUTH_TEST_PASSWORD,
});
