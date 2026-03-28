import {
  buildPeopleCsvFilename,
  serializePeopleCsv,
} from "@/features/network/people-csv";
import type { Person } from "@/lib/validation/person";

function makePerson(overrides: Partial<Person>): Person {
  return {
    id: "person-1",
    slug: "person-1",
    fullName: "person one",
    avatarUrl: "https://example.com/avatar.png",
    headline: "builder",
    bio: "writes code",
    program: "computer science",
    gradYear: 2026,
    focusAreas: ["systems"],
    location: "tempe, az",
    links: [],
    connectedTo: [],
    workedAt: [],
    ...overrides,
  };
}

describe("serializePeopleCsv", () => {
  it("serializes public people into a readable csv with fixed headers", () => {
    const firstPerson = makePerson({
      id: "maya",
      slug: "maya-chen",
      fullName: 'maya "m" chen',
      headline: 'builds "systems", infra',
      bio: "line 1\nline 2",
      program: "computer science",
      gradYear: 2027,
      location: "tempe, az",
      avatarUrl: "https://example.com/maya.png",
      focusAreas: ["systems", "ai"],
      links: [
        { type: "site", label: "site", href: "https://maya.dev" },
        { type: "github", label: "github", href: "https://github.com/maya" },
        {
          type: "linkedin",
          label: "linkedin",
          href: "https://linkedin.com/in/maya",
        },
        { type: "x", label: "x", href: "https://x.com/maya" },
        {
          type: "email",
          label: "email",
          href: "mailto:maya@asu.edu?subject=hello",
        },
      ],
      connectedTo: ["sam", "missing", "sam"],
      workedAt: [
        { name: "google", logoUrl: "https://logo.clearbit.com/google.com" },
        { name: "openai", logoUrl: "https://logo.clearbit.com/openai.com" },
      ],
    });
    const secondPerson = makePerson({
      id: "sam",
      slug: "sam-lee",
      fullName: "sam lee",
      links: [{ type: "site", label: "site", href: "https://sam.dev" }],
    });

    const csv = serializePeopleCsv(
      [firstPerson],
      [firstPerson, secondPerson],
      "https://asunetwork.com/",
    );

    expect(csv.startsWith("\ufeff")).toBe(true);

    const firstBreak = csv.indexOf("\r\n");
    expect(firstBreak).toBeGreaterThan(-1);
    expect(csv.slice(1, firstBreak)).toBe(
      [
        '"full_name"',
        '"headline"',
        '"bio"',
        '"program"',
        '"grad_year"',
        '"location"',
        '"avatar_url"',
        '"website_url"',
        '"github_url"',
        '"linkedin_url"',
        '"x_url"',
        '"email"',
        '"focus_areas"',
        '"worked_at"',
        '"connected_people"',
        '"slug"',
        '"profile_url"',
      ].join(","),
    );
    expect(csv).toContain('"maya ""m"" chen"');
    expect(csv).toContain('"builds ""systems"", infra"');
    expect(csv).toContain('"line 1\nline 2"');
    expect(csv).toContain('"maya@asu.edu"');
    expect(csv).not.toContain("mailto:maya@asu.edu");
    expect(csv).toContain('"systems | ai"');
    expect(csv).toContain('"google | openai"');
    expect(csv).toContain('"sam lee"');
    expect(csv).not.toContain('"missing"');
    expect(csv).toContain('"https://asunetwork.com/people/maya-chen"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });
});

describe("buildPeopleCsvFilename", () => {
  it("builds the default filename when there is no query", () => {
    const filename = buildPeopleCsvFilename("", new Date("2026-03-28T12:00:00Z"));

    expect(filename).toBe("asu-network-members-2026-03-28.csv");
  });

  it("sanitizes the query for use in the filename", () => {
    const filename = buildPeopleCsvFilename(
      "  ai + systems / builders!!!  ",
      new Date("2026-03-28T12:00:00Z"),
    );

    expect(filename).toBe(
      "asu-network-members-ai-systems-builders-2026-03-28.csv",
    );
  });
});
