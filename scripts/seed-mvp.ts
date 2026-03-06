import { eq, inArray, or } from "drizzle-orm";

import { getDb } from "../src/db/client";
import {
  links,
  people,
  personConnections,
  personSkills,
  skills,
} from "../src/db/schema";
import { samplePeople } from "../src/data/sample-data";

async function main() {
  const db = getDb();
  if (!db) {
    throw new Error("DATABASE_URL is required for seeding.");
  }

  const idBySampleId = new Map<string, number>();

  for (const person of samplePeople) {
    const [row] = await db
      .insert(people)
      .values({
        slug: person.slug,
        fullName: person.fullName,
        headline: person.headline,
        bio: person.bio,
        program: person.program,
        gradYear: person.gradYear,
        location: person.location,
        avatarUrl: person.avatarUrl,
        isPublished: true,
      })
      .onConflictDoUpdate({
        target: people.slug,
        set: {
          fullName: person.fullName,
          headline: person.headline,
          bio: person.bio,
          program: person.program,
          gradYear: person.gradYear,
          location: person.location,
          avatarUrl: person.avatarUrl,
          isPublished: true,
          updatedAt: new Date(),
        },
      })
      .returning({ id: people.id });

    if (!row) {
      continue;
    }

    idBySampleId.set(person.id, row.id);
    await db.delete(links).where(eq(links.personId, row.id));

    if (person.links.length > 0) {
      await db.insert(links).values(
        person.links.map((link) => ({
          personId: row.id,
          type: link.type,
          url: link.href,
          isPublic: true,
        })),
      );
    }
  }

  const personIds = Array.from(idBySampleId.values());
  if (personIds.length === 0) {
    console.log("No people were seeded.");
    return;
  }

  const uniqueSkills = Array.from(
    new Set(samplePeople.flatMap((person) => person.focusAreas)),
  );
  if (uniqueSkills.length > 0) {
    await db
      .insert(skills)
      .values(uniqueSkills.map((name) => ({ name })))
      .onConflictDoNothing();
  }

  const skillRows =
    uniqueSkills.length === 0
      ? []
      : await db
          .select({ id: skills.id, name: skills.name })
          .from(skills)
          .where(inArray(skills.name, uniqueSkills));

  const skillIdByName = new Map(skillRows.map((row) => [row.name, row.id]));

  await db.delete(personSkills).where(inArray(personSkills.personId, personIds));
  const personSkillRows = samplePeople.flatMap((person) => {
    const personId = idBySampleId.get(person.id);
    if (!personId) {
      return [];
    }

    return person.focusAreas
      .map((skillName) => {
        const skillId = skillIdByName.get(skillName);
        if (!skillId) {
          return null;
        }
        return { personId, skillId };
      })
      .filter((entry): entry is { personId: number; skillId: number } => entry !== null);
  });
  if (personSkillRows.length > 0) {
    await db.insert(personSkills).values(personSkillRows).onConflictDoNothing();
  }

  await db
    .delete(personConnections)
    .where(
      or(
        inArray(personConnections.sourcePersonId, personIds),
        inArray(personConnections.targetPersonId, personIds),
      ),
    );

  const edgeSet = new Set<string>();
  const connectionRows: { sourcePersonId: number; targetPersonId: number }[] = [];
  for (const person of samplePeople) {
    const sourceId = idBySampleId.get(person.id);
    if (!sourceId) {
      continue;
    }

    for (const connectedSampleId of person.connectedTo) {
      const targetId = idBySampleId.get(connectedSampleId);
      if (!targetId || targetId === sourceId) {
        continue;
      }

      const left = Math.min(sourceId, targetId);
      const right = Math.max(sourceId, targetId);
      const key = `${left}:${right}`;
      if (edgeSet.has(key)) {
        continue;
      }
      edgeSet.add(key);
      connectionRows.push({
        sourcePersonId: left,
        targetPersonId: right,
      });
    }
  }

  if (connectionRows.length > 0) {
    await db.insert(personConnections).values(connectionRows).onConflictDoNothing();
  }

  console.log(
    `seed complete: ${personIds.length} people, ${personSkillRows.length} person_skills, ${connectionRows.length} connections`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
