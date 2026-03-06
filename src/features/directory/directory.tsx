"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Person } from "@/lib/validation/person";

type DirectoryProps = {
  people: Person[];
};

export function Directory({ people }: DirectoryProps) {
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState("all");

  const programs = useMemo(
    () => ["all", ...new Set(people.map((person) => person.program))],
    [people],
  );

  const filtered = useMemo(() => {
    return people.filter((person) => {
      const matchesProgram = program === "all" || person.program === program;
      const haystack = [
        person.fullName,
        person.headline,
        person.program,
        person.focusAreas.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = query.trim().length === 0 || haystack.includes(query.toLowerCase());
      return matchesProgram && matchesQuery;
    });
  }, [people, program, query]);

  return (
    <DirectoryShell>
      <DirectoryFilters
        query={query}
        program={program}
        programs={programs}
        onProgramChange={setProgram}
        onQueryChange={setQuery}
      />
      <DirectoryResults people={filtered} />
    </DirectoryShell>
  );
}

function DirectoryShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-6 rounded-2xl border border-line/60 bg-surface/90 p-5 shadow-[0_24px_80px_rgba(15,27,42,0.08)] sm:p-8">
      {children}
    </section>
  );
}

type DirectoryFiltersProps = {
  query: string;
  program: string;
  programs: string[];
  onQueryChange: (value: string) => void;
  onProgramChange: (value: string) => void;
};

function DirectoryFilters({
  query,
  program,
  programs,
  onProgramChange,
  onQueryChange,
}: DirectoryFiltersProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
      <label className="flex flex-col gap-2 font-mono text-xs lowercase tracking-[0.2em] text-muted">
        Search by name, skill, or headline
        <input
          className="h-11 rounded-xl border border-line/80 bg-white px-4 font-sans text-sm tracking-normal text-foreground outline-none ring-accent transition focus:ring-2"
          value={query}
          placeholder="Try: ML, growth, product, systems..."
          onChange={(event) => onQueryChange(event.currentTarget.value)}
        />
      </label>
      <label className="flex flex-col gap-2 font-mono text-xs lowercase tracking-[0.2em] text-muted">
        Program
        <select
          className="h-11 rounded-xl border border-line/80 bg-white px-3 font-sans text-sm tracking-normal text-foreground outline-none ring-accent transition focus:ring-2"
          value={program}
          onChange={(event) => onProgramChange(event.currentTarget.value)}
        >
          {programs.map((entry) => (
            <option key={entry} value={entry}>
              {entry === "all" ? "All Programs" : entry}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function DirectoryResults({ people }: { people: Person[] }) {
  if (people.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-strong/40 p-8 text-center text-sm text-muted">
        No matches yet. Try broadening your query or changing program filters.
      </div>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {people.map((person) => (
        <li key={person.id} className="rounded-xl border border-line/70 bg-surface p-5">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-xl text-foreground">{person.fullName}</h3>
              <p className="text-sm text-muted">{person.program}</p>
            </div>
            <span className="rounded-full bg-accent/15 px-3 py-1 font-mono text-xs text-accent-ink">
              {person.gradYear}
            </span>
          </div>
          <p className="mb-3 text-sm text-foreground/90">{person.headline}</p>
          <ul className="mb-4 flex flex-wrap gap-2">
            {person.focusAreas.map((focus) => (
              <li
                key={`${person.id}-${focus}`}
                className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] lowercase tracking-[0.12em] text-muted"
              >
                {focus}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{person.location}</span>
            <Link
              href={`/people/${person.slug}`}
              className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-accent-ink"
            >
              View Profile
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

