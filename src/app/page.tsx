import Link from "next/link";

import { samplePeople } from "@/data/sample-data";

export default function Home() {
  const programCount = new Set(samplePeople.map((person) => person.program)).size;
  const linkCount = samplePeople.reduce((count, person) => count + person.links.length, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
      <section className="shell rise overflow-hidden rounded-3xl border border-line/60 p-8 shadow-[0_30px_100px_rgba(15,27,42,0.12)] sm:p-12">
        <p className="rise font-mono text-xs uppercase tracking-[0.28em] text-muted">asu.network</p>
        <h1 className="display-heading rise rise-delay-1 mt-3 max-w-3xl text-5xl leading-[1.02] sm:text-7xl">
          Build Your ASU Network
        </h1>
        <p className="rise rise-delay-2 mt-6 max-w-2xl text-base text-muted sm:text-lg">
          Discover talented engineers, business operators, and builders across ASU. Explore profiles,
          understand connections, and reach out quickly.
        </p>
        <div className="rise rise-delay-3 mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/people"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:bg-accent-ink"
          >
            Explore People
          </Link>
          <Link
            href="/join"
            className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold transition hover:bg-surface-strong/50"
          >
            Join the Network
          </Link>
          <Link
            href="/graph"
            className="rounded-full border border-transparent px-4 py-3 text-sm text-muted underline-offset-4 transition hover:underline"
          >
            View Graph Prototype
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="People in Seed Directory" value={String(samplePeople.length)} />
        <Metric label="Programs Represented" value={String(programCount)} />
        <Metric label="Connection Links" value={String(linkCount)} />
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-line/70 bg-surface p-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">What You Can Do</p>
          <h2 className="display-heading mb-3 text-2xl">Find high-signal collaborators</h2>
          <p className="text-sm leading-relaxed text-muted">
            Use searchable profiles to find people by skills, programs, and focus areas. Each profile includes
            public links so outreach is direct.
          </p>
        </article>
        <article className="rounded-2xl border border-line/70 bg-surface p-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">Why It Exists</p>
          <h2 className="display-heading mb-3 text-2xl">Make momentum easier</h2>
          <p className="text-sm leading-relaxed text-muted">
            Great people are already building at ASU. `asu.network` reduces discovery friction and helps teams
            form faster around real projects.
          </p>
        </article>
      </section>
    </main>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <article className="rounded-2xl border border-line/70 bg-surface p-5">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="display-heading mt-2 text-4xl text-foreground">{value}</p>
    </article>
  );
}
