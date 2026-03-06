import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  links,
  organizations,
  people,
  personConnections,
  personOrganizations,
  personSkills,
  skills,
} from "@/db/schema";
import { samplePeople } from "@/data/sample-data";
import { peopleQuerySchema, personSchema, type Person } from "@/lib/validation/person";

type PeopleQuery = {
  q: string;
  program: string;
  limit: number;
};

type PeopleResult = {
  data: Person[];
  total: number;
  source: "db" | "sample";
};

const linkLabelByType = {
  github: "GitHub",
  linkedin: "LinkedIn",
  email: "Email",
  site: "Site",
  x: "X",
} as const;

const defaultFocusAreas = ["builders"];
const companyDomainByName: Record<string, string> = {
  microsoft: "microsoft.com",
  amazon: "amazon.com",
  google: "google.com",
  nvidia: "nvidia.com",
  adobe: "adobe.com",
  intel: "intel.com",
  tesla: "tesla.com",
  doordash: "doordash.com",
  "capital one": "capitalone.com",
  deloitte: "deloitte.com",
};

export async function listPeople(input: PeopleQuery): Promise<PeopleResult> {
  const parsed = peopleQuerySchema.parse(input);
  const db = getDb();

  if (!db) {
    return listPeopleFromSample(parsed);
  }

  try {
    return await listPeopleFromDb(parsed);
  } catch (error) {
    console.error("listPeople db query failed, falling back to sample data", error);
    return listPeopleFromSample(parsed);
  }
}

async function listPeopleFromDb(query: PeopleQuery): Promise<PeopleResult> {
  const db = getDb();
  if (!db) {
    return listPeopleFromSample(query);
  }

  const where = buildWhere(query.q, query.program);
  const personRows = await db
    .select({
      id: people.id,
      slug: people.slug,
      fullName: people.fullName,
      headline: people.headline,
      bio: people.bio,
      program: people.program,
      gradYear: people.gradYear,
      location: people.location,
      avatarUrl: people.avatarUrl,
    })
    .from(people)
    .where(where)
    .orderBy(desc(people.createdAt))
    .limit(query.limit);

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(people)
    .where(where);

  if (personRows.length === 0) {
    return {
      data: [],
      total: Number(countRows[0]?.count ?? 0),
      source: "db",
    };
  }

  const personIds = personRows.map((row) => row.id);
  const [linkRows, skillRows, connectionRows, organizationRows] = await Promise.all([
    db
      .select({
        personId: links.personId,
        type: links.type,
        href: links.url,
      })
      .from(links)
      .where(and(inArray(links.personId, personIds), eq(links.isPublic, true))),
    db
      .select({
        personId: personSkills.personId,
        name: skills.name,
      })
      .from(personSkills)
      .innerJoin(skills, eq(personSkills.skillId, skills.id))
      .where(inArray(personSkills.personId, personIds)),
    db
      .select({
        sourcePersonId: personConnections.sourcePersonId,
        targetPersonId: personConnections.targetPersonId,
      })
      .from(personConnections)
      .where(
        or(
          inArray(personConnections.sourcePersonId, personIds),
          inArray(personConnections.targetPersonId, personIds),
        ),
      ),
    db
      .select({
        personId: personOrganizations.personId,
        organizationName: organizations.name,
      })
      .from(personOrganizations)
      .innerJoin(
        organizations,
        eq(personOrganizations.organizationId, organizations.id),
      )
      .where(inArray(personOrganizations.personId, personIds)),
  ]);

  const linksByPerson = groupByPerson(linkRows);
  const skillsByPerson = groupSkillNames(skillRows);
  const connectionsByPerson = buildConnectionMap(connectionRows);
  const organizationsByPerson = groupOrganizationNames(organizationRows);

  const mapped = personRows.map((row) => {
    const fullName = row.fullName.trim();
    const focusAreas = uniqueStrings(skillsByPerson.get(row.id) ?? defaultFocusAreas);
    const mappedLinks = (linksByPerson.get(row.id) ?? []).map((entry) => ({
      type: entry.type,
      label: linkLabelByType[entry.type],
      href: entry.href,
    }));

    return {
      id: toClientPersonId(row.id),
      slug: row.slug,
      fullName,
      avatarUrl:
        row.avatarUrl && row.avatarUrl.length > 0
          ? row.avatarUrl
          : `https://api.dicebear.com/9.x/personas/png?seed=${encodeURIComponent(fullName)}`,
      headline: row.headline,
      bio: row.bio,
      program: row.program,
      gradYear: row.gradYear ?? new Date().getFullYear() + 1,
      focusAreas,
      location: row.location ?? "tempe, az",
      links: mappedLinks,
      connectedTo: uniqueStrings(connectionsByPerson.get(row.id) ?? []),
      workedAt: uniqueStrings(organizationsByPerson.get(row.id) ?? [])
        .slice(0, 3)
        .map((name) => ({
          name,
          logoUrl: companyLogoUrl(name),
        })),
    };
  });

  return {
    data: personSchema.array().parse(mapped),
    total: Number(countRows[0]?.count ?? mapped.length),
    source: "db",
  };
}

function listPeopleFromSample(query: PeopleQuery): PeopleResult {
  const qLower = query.q.trim().toLowerCase();
  const filtered = samplePeople.filter((person) => {
    const byProgram = query.program === "all" || person.program === query.program;
    const byQuery =
      qLower.length === 0 ||
      [person.fullName, person.headline, person.bio, person.focusAreas.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(qLower);
    return byProgram && byQuery;
  });

  return {
    data: filtered.slice(0, query.limit),
    total: filtered.length,
    source: "sample",
  };
}

function buildWhere(q: string, program: string) {
  const base = [eq(people.isPublished, true)];
  if (program !== "all") {
    base.push(eq(people.program, program));
  }

  const term = q.trim();
  if (term.length === 0) {
    return and(...base);
  }

  const search = `%${term}%`;
  const searchFilter = or(
    ilike(people.fullName, search),
    ilike(people.headline, search),
    ilike(people.bio, search),
    ilike(people.program, search),
  );
  return searchFilter ? and(...base, searchFilter) : and(...base);
}

function toClientPersonId(id: number) {
  return `db-${id}`;
}

function groupByPerson<T extends { personId: number }>(rows: T[]) {
  const map = new Map<number, T[]>();
  for (const row of rows) {
    const current = map.get(row.personId) ?? [];
    current.push(row);
    map.set(row.personId, current);
  }
  return map;
}

function groupSkillNames(rows: { personId: number; name: string }[]) {
  const map = new Map<number, string[]>();
  for (const row of rows) {
    const current = map.get(row.personId) ?? [];
    current.push(row.name);
    map.set(row.personId, current);
  }
  return map;
}

function groupOrganizationNames(rows: { personId: number; organizationName: string }[]) {
  const map = new Map<number, string[]>();
  for (const row of rows) {
    const current = map.get(row.personId) ?? [];
    current.push(row.organizationName);
    map.set(row.personId, current);
  }
  return map;
}

function buildConnectionMap(rows: { sourcePersonId: number; targetPersonId: number }[]) {
  const map = new Map<number, string[]>();
  for (const row of rows) {
    const source = map.get(row.sourcePersonId) ?? [];
    source.push(toClientPersonId(row.targetPersonId));
    map.set(row.sourcePersonId, source);

    const target = map.get(row.targetPersonId) ?? [];
    target.push(toClientPersonId(row.sourcePersonId));
    map.set(row.targetPersonId, target);
  }
  return map;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function companyLogoUrl(name: string) {
  const domain = companyDomainByName[name.toLowerCase()] ?? "asu.edu";
  return `https://logo.clearbit.com/${domain}`;
}
