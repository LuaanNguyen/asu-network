import { JoinForm } from "@/features/join/join-form";

export default function JoinPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14 sm:px-8">
      <header className="mb-8 space-y-4">
        <p className="font-mono text-xs lowercase tracking-[0.2em] text-muted">Join asu.network</p>
        <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Submit Your Profile
        </h1>
        <p className="max-w-2xl text-base text-muted sm:text-lg">
          Share what you build, what you are looking for, and where people can reach you. All submissions
          are reviewed before publication.
        </p>
      </header>
      <JoinForm />
    </main>
  );
}

