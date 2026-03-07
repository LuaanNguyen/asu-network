"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { samplePeople } from "@/data/sample-data";
import { JoinForm } from "@/features/join/join-form";
import { NetworkWorkspace } from "@/features/network/network-workspace";
import type { Person } from "@/lib/validation/person";

export default function Home() {
  const [formOpen, setFormOpen] = useState(false);
  const [people, setPeople] = useState<Person[]>(samplePeople);

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

  useEffect(() => {
    const controller = new AbortController();

    async function loadPeople() {
      try {
        const response = await fetch("/api/people?limit=200", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { data?: Person[] };
        if (Array.isArray(payload.data)) {
          setPeople(payload.data);
        }
      } catch {
        // Keep sample data fallback on network/API errors.
      }
    }

    void loadPeople();
    return () => controller.abort();
  }, []);

  return (
    <>
      <main
        id="top"
        className="mx-auto flex min-h-[calc(100dvh-132px)] w-full max-w-none flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6 lg:h-[calc(100dvh-80px)] lg:px-6 lg:pb-2 lg:pt-3 xl:px-8"
      >
        {/* Mobile-only header — shown above workspace on small screens */}
        <div className="mb-4 shrink-0 space-y-2.5 lg:hidden">
          <h1 className="display-heading text-3xl leading-tight sm:text-5xl mb-2">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/">asunetwork.com</a>
          </h1>
          <p className="max-w-5xl text-sm leading-relaxed text-muted sm:text-base">
            our school is home to some of the most talented engineers, builders,
            makers, artists, designers, writers, and everything in between. this
            is a place to find other cool people who also go to asu, a directory
            of the people who actually make this place special.
          </p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-accent-ink transition hover:border-accent hover:bg-accent/10"
          >
            want to join? fill out the form
          </button>
        </div>

        <NetworkWorkspace
          className="min-h-0 flex-1"
          people={people}
          header={
            <div className="mb-4 hidden space-y-1.5 lg:block">
              <h1 className="display-heading text-3xl leading-tight">
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                welcome to <a href="/">asunetwork.com</a>
              </h1>
              <p className="text-sm leading-relaxed text-muted">
                our school is home to some of the most talented engineers,
                builders, makers, artists, designers, writers, and everything in
                between. this is a place to find other cool people who also go
                to asu, a directory of the people who actually make this place
                special.
              </p>
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-semibold text-accent-ink transition hover:border-accent hover:bg-accent/10"
              >
                want to join? fill out the form
              </button>
            </div>
          }
        />
      </main>

      {formOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Join asunetwork.com"
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f1b2a]/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setFormOpen(false);
            }
          }}
        >
          <div className="shell relative h-[100dvh] w-full overflow-y-auto rounded-none border-0 p-4 pb-6 pt-5 sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl sm:border sm:p-6">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:text-foreground sm:h-9 sm:w-9"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <div className="mb-4 pr-12 sm:mb-5">
              <h2 className="display-heading text-2xl leading-tight sm:text-3xl">
                join asunetwork.com
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                add your profile and links. submissions are reviewed before
                publication.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      ) : null}
    </>
  );
}
