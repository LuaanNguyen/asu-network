import { Directory } from "@/features/directory/directory";
import { samplePeople } from "@/data/sample-data";

export default function PeoplePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-8">
      <header className="mb-8 space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Directory</p>
        <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Discover High-Signal People Across ASU
        </h1>
        <p className="max-w-3xl text-base text-muted sm:text-lg">
          Search by focus area, program, or role and connect with people building meaningful things.
        </p>
      </header>

      <Directory people={samplePeople} />
    </main>
  );
}

