import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const linkTypeEnum = pgEnum("link_type", [
  "github",
  "linkedin",
  "email",
  "site",
  "x",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const people = pgTable(
  "people",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    fullName: text("full_name").notNull(),
    headline: text("headline").notNull(),
    bio: text("bio").notNull(),
    gradYear: integer("grad_year"),
    location: text("location"),
    avatarUrl: text("avatar_url"),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("people_slug_idx").on(table.slug)],
);

export const programs = pgTable(
  "programs",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    school: text("school").notNull(),
    degreeType: text("degree_type").notNull(),
  },
  (table) => [uniqueIndex("programs_name_idx").on(table.name)],
);

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  personId: integer("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  type: linkTypeEnum("type").notNull(),
  url: text("url").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
});

export const skills = pgTable(
  "skills",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("skills_name_idx").on(table.name)],
);

export const personSkills = pgTable(
  "person_skills",
  {
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.personId, table.skillId] })],
);

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
});

export const personOrganizations = pgTable(
  "person_organizations",
  {
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: text("role"),
  },
  (table) => [primaryKey({ columns: [table.personId, table.organizationId] })],
);

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  payloadJson: text("payload_json").notNull(),
  status: submissionStatusEnum("status").notNull().default("pending"),
  reviewNotes: text("review_notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

