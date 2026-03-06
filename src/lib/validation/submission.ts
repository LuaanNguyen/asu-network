import { z } from "zod";

export const submissionSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  asuProgram: z.string().trim().min(2).max(120),
  gradYear: z.coerce.number().int().min(2000).max(2100),
  headline: z.string().trim().max(180).optional().or(z.literal("")),
  bio: z.string().trim().max(1400).optional().or(z.literal("")),
  github: z.string().trim().url().optional().or(z.literal("")),
  linkedin: z.string().trim().url().optional().or(z.literal("")),
  email: z.string().trim().email(),
  site: z.string().trim().url().optional().or(z.literal("")),
  avatarDataUrl: z
    .string()
    .trim()
    .max(2_800_000)
    .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/)
    .optional()
    .or(z.literal("")),
  website: z.string().trim().max(0).optional().default(""),
  consent: z.literal(true),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
