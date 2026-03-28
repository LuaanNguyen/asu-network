import type { Person, ProfileLink } from "@/lib/validation/person";

const UTF8_BOM = "\ufeff";
const ROW_DELIMITER = "\r\n";
const LIST_DELIMITER = " | ";
const MAX_QUERY_LENGTH = 48;
const DEFAULT_FILENAME_PREFIX = "asu-network-members";

const CSV_HEADERS = [
  "full_name",
  "headline",
  "bio",
  "program",
  "grad_year",
  "location",
  "avatar_url",
  "website_url",
  "github_url",
  "linkedin_url",
  "x_url",
  "email",
  "focus_areas",
  "worked_at",
  "connected_people",
  "slug",
  "profile_url",
] as const;

export function serializePeopleCsv(
  people: Person[],
  allLoadedPeople: Person[],
  siteUrl: string,
): string {
  const personNameById = new Map(
    allLoadedPeople.map((person) => [person.id, person.fullName.trim()]),
  );
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);

  const rows = [
    CSV_HEADERS,
    ...people.map((person) => {
      const connectedPeople = uniqueNonEmpty(
        person.connectedTo
          .map((connectionId) => personNameById.get(connectionId)?.trim() ?? "")
          .filter(Boolean),
      );

      return [
        person.fullName,
        person.headline,
        person.bio,
        person.program,
        String(person.gradYear),
        person.location,
        toExportAvatarUrl(person.avatarUrl),
        findLinkHref(person.links, "site"),
        findLinkHref(person.links, "github"),
        findLinkHref(person.links, "linkedin"),
        findLinkHref(person.links, "x"),
        extractEmail(findLinkHref(person.links, "email")),
        joinList(person.focusAreas),
        joinList(person.workedAt.map((company) => company.name)),
        joinList(connectedPeople),
        person.slug,
        `${normalizedSiteUrl}/people/${person.slug}`,
      ];
    }),
  ];

  return (
    UTF8_BOM +
    rows.map((row) => row.map(escapeCsvCell).join(",")).join(ROW_DELIMITER) +
    ROW_DELIMITER
  );
}

export function buildPeopleCsvFilename(query: string, date = new Date()): string {
  const sanitizedQuery = sanitizeQuery(query);
  const dateStamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  if (!sanitizedQuery) {
    return `${DEFAULT_FILENAME_PREFIX}-${dateStamp}.csv`;
  }

  return `${DEFAULT_FILENAME_PREFIX}-${sanitizedQuery}-${dateStamp}.csv`;
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function joinList(values: string[]): string {
  return uniqueNonEmpty(values).join(LIST_DELIMITER);
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
  );
}

function findLinkHref(links: ProfileLink[], type: ProfileLink["type"]): string {
  return links.find((link) => link.type === type)?.href ?? "";
}

function extractEmail(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) {
    return "";
  }

  if (!/^mailto:/i.test(trimmed)) {
    return trimmed;
  }

  const rawEmail = trimmed.replace(/^mailto:/i, "").split("?")[0] ?? "";

  try {
    return decodeURIComponent(rawEmail).trim();
  } catch {
    return rawEmail.trim();
  }
}

function sanitizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_QUERY_LENGTH)
    .replace(/-+$/g, "");
}

function normalizeSiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "https://asunetwork.com";
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/g, "");
  }
}

function toExportAvatarUrl(avatarUrl: string): string {
  const trimmed = avatarUrl.trim();
  if (!trimmed || /^data:image\//i.test(trimmed)) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return trimmed;
    }
  } catch {
    return "";
  }

  return "";
}
