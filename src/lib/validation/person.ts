import { z } from "zod";

export const profileLinkSchema = z.object({
  type: z.enum(["github", "linkedin", "email", "site", "x"]),
  label: z.string().min(1),
  href: z.string().url(),
});

export const companySchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url(),
});

export const personSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  fullName: z.string().min(1),
  avatarUrl: z.string().url(),
  headline: z.string().min(1),
  bio: z.string().min(1),
  program: z.string().min(1),
  gradYear: z.number().int(),
  focusAreas: z.array(z.string().min(1)).min(1),
  location: z.string().min(1),
  links: z.array(profileLinkSchema),
  connectedTo: z.array(z.string().min(1)),
  workedAt: z.array(companySchema).default([]),
});

export const peopleQuerySchema = z.object({
  q: z.string().trim().default(""),
  program: z.string().trim().default("all"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type Person = z.infer<typeof personSchema>;
export type ProfileLink = z.infer<typeof profileLinkSchema>;
export type Company = z.infer<typeof companySchema>;
