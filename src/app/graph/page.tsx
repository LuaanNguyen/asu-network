import dynamic from "next/dynamic";

import { samplePeople } from "@/data/sample-data";

const GraphPreview = dynamic(
  () => import("@/features/graph/graph-preview").then((module) => module.GraphPreview),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-line bg-surface p-8 text-sm text-muted">
        Loading graph module...
      </div>
    ),
  },
);

export default function GraphPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-8">
      <header className="mb-8 space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Connections</p>
        <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Relationship Graph Prototype
        </h1>
        <p className="max-w-3xl text-base text-muted sm:text-lg">
          Explore how builders, operators, and specialists connect through shared projects and communities.
        </p>
      </header>

      <GraphPreview people={samplePeople} />
    </main>
  );
}
