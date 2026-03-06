import { samplePeople } from "@/data/sample-data";
import { NetworkWorkspace } from "@/features/network/network-workspace";

export default function Home() {
  return (
    <main
      id="top"
      className="mx-auto flex h-[calc(100dvh-86px)] w-full max-w-none flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6"
    >
      <header className="mb-4 shrink-0">
        <h1 className="display-heading text-4xl leading-tight sm:text-5xl">ASU Talent Network</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted sm:text-base">
          Left side: people list. Right side: force-directed graph with profile-picture nodes.
        </p>
      </header>
      <NetworkWorkspace className="min-h-0 flex-1" people={samplePeople} />
    </main>
  );
}
