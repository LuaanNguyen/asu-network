"use client";

import { useMemo, useState } from "react";

import type { Person } from "@/lib/validation/person";

type Point = { x: number; y: number };

type GraphPreviewProps = {
  people: Person[];
};

export function GraphPreview({ people }: GraphPreviewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(people[0]?.id ?? null);

  const points = useMemo<Record<string, Point>>(() => {
    const map: Record<string, Point> = {};
    const radius = 150;
    const center = { x: 220, y: 220 };
    const count = Math.max(people.length, 1);

    for (const [index, person] of people.entries()) {
      const angle = (index / count) * Math.PI * 2;
      map[person.id] = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };
    }

    return map;
  }, [people]);

  const selected = people.find((person) => person.id === selectedId) ?? people[0] ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <svg
          viewBox="0 0 440 440"
          role="img"
          aria-label="ASU network relationship graph"
          className="h-full w-full"
        >
          {people.flatMap((person) =>
            person.connectedTo.map((targetId) => {
              const source = points[person.id];
              const target = points[targetId];
              if (!source || !target) {
                return [];
              }
              return (
                <line
                  key={`${person.id}-${targetId}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="var(--color-line)"
                  strokeWidth={1.5}
                  opacity={0.9}
                />
              );
            }),
          )}
          {people.map((person) => {
            const point = points[person.id];
            const isSelected = person.id === selectedId;
            return (
              <g key={person.id} transform={`translate(${point.x}, ${point.y})`}>
                <circle
                  r={isSelected ? 16 : 12}
                  fill={isSelected ? "var(--color-accent)" : "var(--color-surface-strong)"}
                  stroke="var(--color-accent-ink)"
                  strokeWidth={isSelected ? 2 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => setSelectedId(person.id)}
                />
                <text
                  x={18}
                  y={4}
                  fontSize={10}
                  fontFamily="var(--font-plex-mono)"
                  fill="var(--color-ink)"
                >
                  {person.fullName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <aside className="rounded-2xl border border-line/80 bg-surface p-5">
        <p className="mb-2 font-mono text-xs lowercase tracking-[0.2em] text-muted">Selected</p>
        {selected ? (
          <div>
            <h3 className="mb-1 font-display text-xl">{selected.fullName}</h3>
            <p className="mb-3 text-sm text-muted">{selected.headline}</p>
            <p className="mb-2 text-xs lowercase tracking-[0.16em] text-muted">Connections</p>
            <ul className="space-y-2 text-sm">
              {selected.connectedTo.map((id) => {
                const person = people.find((entry) => entry.id === id);
                return <li key={`${selected.id}-${id}`}>{person?.fullName ?? "Unknown"}</li>;
              })}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted">No node selected.</p>
        )}
      </aside>
    </div>
  );
}

