import type { Person, ProfileLink } from "@/lib/validation/person";

const UTF8_BOM = "\ufeff";
const ROW_DELIMITER = "\r\n";
const MAX_QUERY_LENGTH = 48;
const DEFAULT_FILENAME_PREFIX = "asu-network-members";

const CSV_HEADERS = [
  "full_name",
  "headline",
  "program",
  "grad_year",
  "location",
  "website_url",
  "github_url",
  "linkedin_url",
  "x_url",
  "email",
] as const;

export function serializePeopleCsv(
  people: Person[],
  _allLoadedPeople: Person[],
  _siteUrl: string,
): string {
  const rows = [
    CSV_HEADERS,
    ...people.map((person) => [
        person.fullName,
        person.headline,
        person.program,
        String(person.gradYear),
        person.location,
        findLinkHref(person.links, "site"),
        findLinkHref(person.links, "github"),
        findLinkHref(person.links, "linkedin"),
        findLinkHref(person.links, "x"),
        extractEmail(findLinkHref(person.links, "email")),
      ]),
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
