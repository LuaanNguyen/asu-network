"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { samplePeople } from "@/data/sample-data";
import { JoinForm } from "@/features/join/join-form";
import { NetworkWorkspace } from "@/features/network/network-workspace";

export default function Home() {
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!formOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFormOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [formOpen]);

  return (
    <>
      <main
        id="top"
        className="mx-auto flex h-[calc(100dvh-86px)] w-full max-w-none flex-col px-5 pb-5 pt-5 sm:px-8 sm:pb-8 sm:pt-7"
      >
        <header className="mb-5 shrink-0 space-y-2.5">
          <h1 className="display-heading text-4xl leading-tight sm:text-5xl">welcome to asu.network</h1>
          <p className="max-w-5xl text-sm text-muted sm:text-base">
            asu packs an unusually high density of talented engineers, designers, creators, and
            researchers. this is the place to find the people doing things, from side projects and
            research labs to startups and student organizations. some are already shipping at a high
            level, others are just getting started, but the common thread is real work and real
            momentum.
          </p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-accent-ink transition hover:border-accent hover:bg-accent/10"
          >
            want to join? fill out the form
          </button>
        </header>
        <NetworkWorkspace className="min-h-0 flex-1" people={samplePeople} />
      </main>

      {formOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Join asu.network"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1b2a]/40 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setFormOpen(false);
            }
          }}
        >
          <div className="shell relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-line p-4 sm:p-6">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:text-foreground"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <div className="mb-4 pr-12">
              <h2 className="display-heading text-3xl">join asu.network</h2>
              <p className="mt-1 text-sm text-muted">
                add your profile and links. submissions are reviewed before publication.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      ) : null}
    </>
  );
}
