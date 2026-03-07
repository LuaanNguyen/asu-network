import { z } from "zod";

const SUPPORTED_DATA_IMAGE_PATTERN =
  /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-zA-Z0-9+/=]+$/i;
const HTTP_PROTOCOL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;

const optionalNormalizedUrlSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => {
      const raw = typeof value === "string" ? value : "";
      return isValidOptionalHttpUrl(raw);
    },
    { message: "invalid url" },
  )
  .transform((value) => {
    const raw = typeof value === "string" ? value : "";
    return normalizeOptionalHttpUrl(raw);
  });

export const submissionSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  asuProgram: z.string().trim().min(2).max(120),
  gradYear: z.coerce.number().int().min(2000).max(2100),
  headline: z.string().trim().max(180).optional().or(z.literal("")),
  bio: z.string().trim().max(1400).optional().or(z.literal("")),
  github: optionalNormalizedUrlSchema,
  linkedin: optionalNormalizedUrlSchema,
  x: optionalNormalizedUrlSchema,
  email: z.string().trim().email(),
  site: optionalNormalizedUrlSchema,
  avatarDataUrl: z
    .string()
    .trim()
    .max(2_800_000)
    .regex(
      SUPPORTED_DATA_IMAGE_PATTERN,
      "unsupported image format. use png, jpg, webp, gif, or avif.",
    )
    .optional()
    .or(z.literal("")),
  website: z.string().trim().max(0).optional().default(""),
  consent: z.literal(true),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

function isValidOptionalHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  const candidate = HTTP_PROTOCOL_PATTERN.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    return url.host.length > 0;
  } catch {
    return false;
  }
}

function normalizeOptionalHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const candidate = HTTP_PROTOCOL_PATTERN.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return candidate;
    }
    const host = url.host.toLowerCase().replace(/^www\./, "");
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/g, "");
    return `${url.protocol}//${host}${path}${url.search}${url.hash}`;
  } catch {
    return candidate;
  }
}
