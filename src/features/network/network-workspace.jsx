"use client";

import {
  Github,
  LinkIcon,
  Linkedin,
  Mail,
  Search,
  Twitter,
} from "lucide-react";
import { forceCollide } from "d3-force-3d";
import NextImage from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const NODE_RADIUS = 20;
const LINK_ICON_CLASS = "h-3.5 w-3.5";
const LINK_ICON_BY_TYPE = {
  github: Github,
  linkedin: Linkedin,
  email: Mail,
  x: Twitter,
};

export function NetworkWorkspace({ className, people }) {
  const [query, setQuery] = useState("");
  const [mobilePane, setMobilePane] = useState("list");
  const [selectedId, setSelectedId] = useState(people[0]?.id ?? "");
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 });
  const [, refreshImages] = useState(0);

  const graphRef = useRef(null);
  const graphContainerRef = useRef(null);
  const imageCache = useRef(new Map());
  const hasPlayedIntroRef = useRef(false);

  const filteredPeople = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length === 0) {
      return people;
    }

    return people.filter((person) => {
      const haystack = [
        person.fullName,
        person.headline,
        person.program,
        person.focusAreas.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [people, query]);

  const activeSelectedId = filteredPeople.some(
    (person) => person.id === selectedId,
  )
    ? selectedId
    : (filteredPeople[0]?.id ?? "");
  const programCount = useMemo(
    () => new Set(filteredPeople.map((person) => person.program)).size,
    [filteredPeople],
  );

  const graphData = useMemo(() => {
    const visibleIds = new Set(filteredPeople.map((person) => person.id));
    const count = Math.max(filteredPeople.length, 1);
    const baseRadius = Math.min(420, Math.max(150, count * 24));
    const nodes = filteredPeople.map((person, index) => {
      const angle = (index / count) * Math.PI * 2;
      return {
        id: person.id,
        person,
        x: Math.cos(angle) * baseRadius,
        y: Math.sin(angle) * baseRadius,
      };
    });
    const links = [];
    const seen = new Set();

    for (const person of filteredPeople) {
      for (const targetId of person.connectedTo) {
        if (!visibleIds.has(targetId) || person.id === targetId) {
          continue;
        }

        const source = person.id < targetId ? person.id : targetId;
        const target = person.id < targetId ? targetId : person.id;
        const key = `${source}:${target}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        links.push({ source, target });
      }
    }

    return { nodes, links };
  }, [filteredPeople]);

  const nodeCount = graphData.nodes.length;
  const graphTune = useMemo(() => {
    if (nodeCount <= 6) {
      return {
        collide: NODE_RADIUS * 2.8,
        charge: -1800,
        chargeDistanceMax: 1800,
        linkDistance: 180,
        linkStrength: 0.15,
        zoom: 1.6,
      };
    }
    if (nodeCount <= 12) {
      return {
        collide: NODE_RADIUS * 3.0,
        charge: -2400,
        chargeDistanceMax: 2400,
        linkDistance: 220,
        linkStrength: 0.1,
        zoom: 1.3,
      };
    }
    return {
      collide: NODE_RADIUS * 3.2,
      charge: -3200,
      chargeDistanceMax: 3500,
      linkDistance: 280,
      linkStrength: 0.06,
      zoom: 1.1,
    };
  }, [nodeCount]);

  useEffect(() => {
    const element = graphContainerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setGraphSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    graph.d3Force("collide", forceCollide(graphTune.collide).strength(1));
    graph.d3Force("charge")?.strength?.(graphTune.charge);
    graph.d3Force("charge")?.distanceMax?.(graphTune.chargeDistanceMax);
    graph.d3Force("link")?.distance?.(graphTune.linkDistance);
    graph.d3Force("link")?.strength?.(graphTune.linkStrength);
    graph.d3Force("center")?.strength?.(0.02);
    graph.d3ReheatSimulation?.();
  }, [graphData, graphTune]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || graphSize.width <= 0 || graphSize.height <= 0) {
      return;
    }

    if (!hasPlayedIntroRef.current) {
      hasPlayedIntroRef.current = true;
      graph.zoom(0.86, 0);
      graph.centerAt(0, 36, 0);

      const timer = window.setTimeout(() => {
        graph.centerAt(0, 0, 1400);
        graph.zoom(graphTune.zoom, 1400);
      }, 110);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      graph.zoom(graphTune.zoom, 380);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [graphData, graphSize.height, graphSize.width, graphTune.zoom]);

  const selectedPerson =
    filteredPeople.find((person) => person.id === activeSelectedId) ??
    people.find((person) => person.id === activeSelectedId) ??
    null;

  function getAvatarImage(url) {
    let image = imageCache.current.get(url);
    if (!image) {
      image = new window.Image();
      image.src = url;
      image.onload = () => refreshImages((value) => value + 1);
      imageCache.current.set(url, image);
    }
    return image.complete ? image : null;
  }

  return (
    <section
      className={cn("grid min-h-0 gap-4 lg:h-full lg:grid-cols-2 lg:gap-5", className)}
    >
      <div className="shell flex rounded-xl border border-line/70 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePane("list")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition",
            mobilePane === "list"
              ? "bg-accent text-white"
              : "text-muted hover:bg-surface-strong/40",
          )}
        >
          people list
        </button>
        <button
          type="button"
          onClick={() => setMobilePane("graph")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition",
            mobilePane === "graph"
              ? "bg-accent text-white"
              : "text-muted hover:bg-surface-strong/40",
          )}
        >
          graph
        </button>
      </div>

      <aside
        className={cn(
          "shell min-h-0 flex-col overflow-hidden rounded-2xl border border-line/70 p-4 sm:p-6 lg:h-full",
          mobilePane === "graph" ? "hidden lg:flex" : "flex h-[56dvh] sm:h-[60dvh] lg:h-full",
        )}
      >
        <header className="space-y-3">
          <p className="font-mono text-xs lowercase tracking-[0.16em] text-muted">
            {filteredPeople.length} members · {programCount} programs
          </p>
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="search by name, program, skill..."
              className="h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-foreground outline-none ring-accent transition focus:ring-2"
            />
          </label>
        </header>

        <div className="mt-5 hidden grid-cols-[minmax(0,2.15fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.8fr)] gap-2 border-b border-line pb-2 font-mono text-[10px] lowercase tracking-[0.14em] text-muted md:grid">
          <p>name</p>
          <p>program</p>
          <p>site</p>
          <p>links</p>
        </div>

        <ul className="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {filteredPeople.length === 0 ? (
            <li className="rounded-xl border border-dashed border-line/80 bg-surface p-4 text-sm text-muted">
              no members yet. use the join form to add the first profile.
            </li>
          ) : (
            filteredPeople.map((person) => {
              const selected = person.id === activeSelectedId;
              const site = person.links.find((link) => link.type === "site");
              const secondaryLinks = person.links.filter(
                (link) => link.type !== "site",
              );

              return (
                <li
                  key={person.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(person.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(person.id);
                    }
                  }}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    selected
                      ? "border-accent bg-accent/10 shadow-[0_12px_26px_rgba(140,29,64,0.2)]"
                      : "border-line/70 bg-surface hover:border-accent/40",
                  )}
                >
                  <div className="grid gap-2 md:grid-cols-[minmax(0,2.15fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.8fr)] md:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <NextImage
                          src={person.avatarUrl}
                          alt={`${person.fullName} avatar`}
                          width={42}
                          height={42}
                          className="h-10 w-10 rounded-full border border-line object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {person.fullName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted md:text-sm">
                      {person.program}
                    </p>

                    <div>
                      {site ? (
                        <a
                          href={site.href}
                          target="_blank"
                          rel="noreferrer"
                          title={site.href}
                          aria-label={`${person.fullName} site ${site.href}`}
                          onClick={(event) => event.stopPropagation()}
                          className="block truncate text-xs text-accent-ink underline-offset-2 hover:underline"
                        >
                          {toBareUrl(site.href)}
                        </a>
                      ) : (
                        <span className="text-xs text-muted/70">-</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {secondaryLinks.map((link) => (
                        <ProfileLinkIcon
                          key={link.href}
                          href={link.href}
                          label={`${person.fullName} ${link.type}`}
                          type={link.type}
                          onClick={(event) => event.stopPropagation()}
                        />
                      ))}
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <section
        className={cn(
          "shell relative min-h-0 overflow-hidden rounded-2xl border border-line/70 p-4 sm:p-5 lg:h-full",
          mobilePane === "list" ? "hidden lg:block" : "block h-[56dvh] sm:h-[60dvh] lg:h-full",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_14%,rgba(140,29,64,0.24),transparent_42%),radial-gradient(circle_at_84%_20%,rgba(255,198,39,0.2),transparent_46%)]" />
        <div ref={graphContainerRef} className="relative h-full min-h-0">
          {graphSize.width > 0 && graphSize.height > 0 ? (
            <ForceGraph2D
              ref={graphRef}
              width={graphSize.width}
              height={graphSize.height}
              graphData={graphData}
              warmupTicks={160}
              cooldownTicks={260}
              d3AlphaDecay={0.012}
              d3VelocityDecay={0.18}
              nodeRelSize={7}
              linkWidth={(link) => {
                const source = getNodeId(link.source);
                const target = getNodeId(link.target);
                return source === activeSelectedId ||
                  target === activeSelectedId
                  ? 2.6
                  : 1.3;
              }}
              linkColor={(link) => {
                const source = getNodeId(link.source);
                const target = getNodeId(link.target);
                return source === activeSelectedId ||
                  target === activeSelectedId
                  ? "rgba(140, 29, 64, 0.92)"
                  : "rgba(15, 27, 42, 0.22)";
              }}
              onNodeClick={(node) => setSelectedId(getNodeId(node.id))}
              nodePointerAreaPaint={(node, color, ctx) => {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(
                  node.x ?? 0,
                  node.y ?? 0,
                  NODE_RADIUS + 9,
                  0,
                  Math.PI * 2,
                  false,
                );
                ctx.fill();
              }}
              nodeCanvasObject={(node, ctx) => {
                const person = node.person;
                if (!person) {
                  return;
                }

                const x = node.x ?? 0;
                const y = node.y ?? 0;
                const selected = person.id === activeSelectedId;
                const radius = selected ? NODE_RADIUS + 3 : NODE_RADIUS;
                const image = getAvatarImage(person.avatarUrl);

                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2, false);
                ctx.closePath();
                ctx.clip();
                if (image) {
                  ctx.drawImage(
                    image,
                    x - radius,
                    y - radius,
                    radius * 2,
                    radius * 2,
                  );
                } else {
                  ctx.fillStyle = "#e9e2d4";
                  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
                }
                ctx.restore();

                ctx.beginPath();
                ctx.arc(x, y, radius + 1, 0, Math.PI * 2, false);
                ctx.strokeStyle = selected ? "#8c1d40" : "#03273a";
                ctx.lineWidth = selected ? 3 : 1.3;
                ctx.stroke();
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              no graph data yet.
            </div>
          )}
        </div>

        {selectedPerson ? (
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl border border-line/70 bg-surface/90 p-3 backdrop-blur-sm">
            <p className="font-mono text-[10px] lowercase tracking-[0.14em] text-muted">
              selected
            </p>
            <p className="mt-1 text-sm font-semibold">
              {selectedPerson.fullName}
            </p>
            <p className="text-xs text-muted">{selectedPerson.headline}</p>
          </div>
        ) : null}
      </section>
    </section>
  );
}

function getNodeId(node) {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (node && typeof node === "object" && "id" in node) {
    const id = node.id;
    if (id != null) {
      return String(id);
    }
  }
  return "";
}

function toBareUrl(href) {
  return href.replace(/^https?:\/\//i, "");
}

function ProfileLinkIcon({ href, type, label, onClick }) {
  const Icon = LINK_ICON_BY_TYPE[type] ?? LinkIcon;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={type}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted transition hover:border-accent hover:bg-accent/10 hover:text-accent-ink"
    >
      <Icon className={LINK_ICON_CLASS} />
    </a>
  );
}
