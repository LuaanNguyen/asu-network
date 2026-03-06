import { samplePeople } from "@/data/sample-data";
import { Directory } from "@/features/directory/directory";
import { GraphPreview } from "@/features/graph/graph-preview";
import { JoinForm } from "@/features/join/join-form";

export default function Home() {
  const programCount = new Set(samplePeople.map((person) => person.program)).size;
  const linkCount = samplePeople.reduce((count, person) => count + person.links.length, 0);

  return (
    <main id="top" className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
      <section className="shell rise overflow-hidden rounded-3xl border border-line/60 p-8 shadow-[0_30px_100px_rgba(15,27,42,0.12)] sm:p-12">
        <p className="rise font-mono text-xs uppercase tracking-[0.28em] text-muted">asu.network</p>
        <h1 className="display-heading rise rise-delay-1 mt-3 max-w-3xl text-5xl leading-[1.02] sm:text-7xl">
          Build Your ASU Network
        </h1>
        <p className="rise rise-delay-2 mt-6 max-w-2xl text-base text-muted sm:text-lg">
          One page to discover talented engineers, operators, and builders across ASU, see how people are
          connected, and submit your profile.
        </p>
        <div className="rise rise-delay-3 mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#people"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:bg-accent-ink"
          >
            Explore People
          </a>
          <a
            href="#graph"
            className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold transition hover:bg-surface-strong/50"
          >
            View Graph
          </a>
          <a
            href="#join"
            className="rounded-full border border-transparent px-4 py-3 text-sm text-muted underline-offset-4 transition hover:underline"
          >
            Submit Profile
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="People in Seed Directory" value={String(samplePeople.length)} />
        <Metric label="Programs Represented" value={String(programCount)} />
        <Metric label="Connection Links" value={String(linkCount)} />
      </section>

      <section id="people" className="mt-12 scroll-mt-28">
        <SectionHeader
          label="People"
          title="Discover High-Signal Collaborators"
          subtitle="Filter by program and search by name, skills, or focus areas."
        />
        <Directory people={samplePeople} />
      </section>

      <section id="graph" className="mt-12 scroll-mt-28">
        <SectionHeader
          label="Connections"
          title="Explore the Talent Graph"
          subtitle="See relationship edges between people and inspect connected profiles quickly."
        />
        <GraphPreview people={samplePeople} />
      </section>

      <section id="join" className="mt-12 scroll-mt-28">
        <SectionHeader
          label="Join"
          title="Submit Your Profile"
          subtitle="Share your work and contact links. Submissions are reviewed before publication."
        />
        <JoinForm />
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

type SectionHeaderProps = {
  label: string;
  title: string;
  subtitle: string;
};

function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
  return (
    <header className="mb-7 space-y-3">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <h2 className="display-heading text-4xl leading-tight">{title}</h2>
      <p className="max-w-3xl text-sm text-muted sm:text-base">{subtitle}</p>
    </header>
  );
}

