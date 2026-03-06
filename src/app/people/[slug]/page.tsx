import Link from "next/link";
import { notFound } from "next/navigation";

import { samplePeople } from "@/data/sample-data";

type ProfilePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const person = samplePeople.find((entry) => entry.slug === slug);

  if (!person) {
    notFound();
  }

  const connected = samplePeople.filter((entry) => person.connectedTo.includes(entry.id));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-8">
      <Link
        href="/people"
        className="mb-6 inline-flex rounded-full border border-line px-4 py-2 text-xs uppercase tracking-[0.14em] text-muted transition hover:bg-surface"
      >
        Back to directory
      </Link>

      <section className="mb-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">{person.program}</p>
        <h1 className="mb-2 font-display text-4xl text-foreground">{person.fullName}</h1>
        <p className="mb-4 text-lg text-muted">{person.headline}</p>
        <p className="text-base leading-relaxed text-foreground/90">{person.bio}</p>
      </section>

      <section className="mb-6 grid gap-6 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-muted">Focus Areas</p>
          <ul className="flex flex-wrap gap-2">
            {person.focusAreas.map((focus) => (
              <li
                key={focus}
                className="rounded-full border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em]"
              >
                {focus}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-muted">Links</p>
          <ul className="space-y-2 text-sm">
            {person.links.map((link) => (
              <li key={link.href}>
                <a className="text-accent-ink underline-offset-2 hover:underline" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-6">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-muted">Connected People</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {connected.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-line/70 p-4">
              <p className="font-semibold">{entry.fullName}</p>
              <p className="text-sm text-muted">{entry.headline}</p>
              <Link
                href={`/people/${entry.slug}`}
                className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.1em] text-accent-ink"
              >
                View Profile
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

