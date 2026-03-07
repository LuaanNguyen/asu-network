"use client";

import {
  Check,
  Github,
  LinkIcon,
  Linkedin,
  Mail,
  Search,
  Twitter,
} from "lucide-react";
import { forceCollide, forceX, forceY } from "d3-force-3d";
import NextImage from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const LINK_ICON_CLASS = "h-3.5 w-3.5";
const LINK_ICON_BY_TYPE = {
  github: Github,
  linkedin: Linkedin,
  email: Mail,
  x: Twitter,
};

export function NetworkWorkspace({ className, people, header }) {
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

    // Enforce a complete mesh: every node connected to every other node.
    if (filteredPeople.length > 1) {
      for (let sourceIndex = 0; sourceIndex < filteredPeople.length; sourceIndex += 1) {
        const sourcePerson = filteredPeople[sourceIndex];
        if (!sourcePerson) {
          continue;
        }
        for (let targetIndex = sourceIndex + 1; targetIndex < filteredPeople.length; targetIndex += 1) {
          const targetPerson = filteredPeople[targetIndex];
          if (!targetPerson) {
            continue;
          }
          const source =
            sourcePerson.id < targetPerson.id ? sourcePerson.id : targetPerson.id;
          const target =
            sourcePerson.id < targetPerson.id ? targetPerson.id : sourcePerson.id;
          const key = `${source}:${target}`;
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          links.push({ source, target, inferred: true });
        }
      }
    }

    return { nodes, links };
  }, [filteredPeople]);

  const nodeRadius = useMemo(() => {
    const width =
      graphSize.width > 0
        ? graphSize.width
        : typeof window !== "undefined"
          ? window.innerWidth
          : 1280;

    if (width >= 1500) {
      return 21;
    }
    if (width >= 1200) {
      return 19;
    }
    if (width >= 900) {
      return 18;
    }
    if (width >= 700) {
      return 16;
    }
    return 14;
  }, [graphSize.width]);

  const nodeCount = graphData.nodes.length;
  const hasGraphLinks = graphData.links.length > 0;
  const graphTune = useMemo(() => {
    if (!hasGraphLinks) {
      if (nodeCount <= 6) {
        return {
          collide: nodeRadius * 2.7,
          charge: -340,
          chargeDistanceMax: 760,
          linkDistance: 160,
          linkStrength: 0,
          zoom: 1.15,
          centerStrength: 0.26,
          axisStrength: 0.1,
        };
      }
      if (nodeCount <= 12) {
        return {
          collide: nodeRadius * 2.9,
          charge: -460,
          chargeDistanceMax: 980,
          linkDistance: 190,
          linkStrength: 0,
          zoom: 1.05,
          centerStrength: 0.22,
          axisStrength: 0.08,
        };
      }
      return {
        collide: nodeRadius * 3.1,
        charge: -580,
        chargeDistanceMax: 1200,
        linkDistance: 220,
        linkStrength: 0,
        zoom: 0.98,
        centerStrength: 0.18,
        axisStrength: 0.07,
      };
    }

    if (nodeCount <= 6) {
      return {
        collide: nodeRadius * 2.8,
        charge: -1800,
        chargeDistanceMax: 1800,
        linkDistance: 180,
        linkStrength: 0.15,
        zoom: 1.6,
        centerStrength: 0.08,
        axisStrength: 0.03,
      };
    }
    if (nodeCount <= 12) {
      return {
        collide: nodeRadius * 3.0,
        charge: -2400,
        chargeDistanceMax: 2400,
        linkDistance: 220,
        linkStrength: 0.1,
        zoom: 1.3,
        centerStrength: 0.06,
        axisStrength: 0.025,
      };
    }
    return {
      collide: nodeRadius * 3.2,
      charge: -3200,
      chargeDistanceMax: 3500,
      linkDistance: 280,
      linkStrength: 0.06,
      zoom: 1.1,
      centerStrength: 0.045,
      axisStrength: 0.02,
    };
  }, [hasGraphLinks, nodeCount, nodeRadius]);

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
    graph.d3Force("center")?.strength?.(graphTune.centerStrength);
    graph.d3Force("x", forceX(0).strength(graphTune.axisStrength));
    graph.d3Force("y", forceY(0).strength(graphTune.axisStrength));
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
      className={cn(
        "grid min-h-0 gap-4 lg:h-full lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-4 xl:gap-5",
        className,
      )}
    >
      <div className="flex w-full rounded-xl border border-line/60 bg-surface/70 p-1 lg:hidden">
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
          "min-h-0 flex-col overflow-hidden p-2 sm:p-3 lg:h-full lg:p-0 xl:p-0",
          mobilePane === "graph"
            ? "hidden lg:flex"
            : "flex h-[60dvh] sm:h-[64dvh] lg:h-full",
        )}
      >
        {header}
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
              className="h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-foreground outline-none ring-accent transition focus:ring-2 lg:h-12"
            />
          </label>
        </header>

        <div className="mt-5 hidden grid-cols-[minmax(0,2.15fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.8fr)] gap-2 border-b border-line pb-2 font-mono text-[10px] lowercase tracking-[0.14em] text-muted md:grid lg:mt-6 lg:pb-3">
          <p>name</p>
          <p>program</p>
          <p>site</p>
          <p>links</p>
        </div>

        <ul className="mt-3 flex-1 space-y-1.5 overflow-y-auto pr-1 lg:mt-3 lg:space-y-1.5 lg:pr-2">
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
                    "cursor-pointer rounded-lg border p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:p-2.5",
                    selected
                      ? "border-accent/45 bg-[linear-gradient(132deg,rgba(140,29,64,0.07),rgba(255,198,39,0.1))] shadow-[0_10px_24px_rgba(140,29,64,0.1)]"
                      : "border-line/70 bg-surface hover:border-accent/40",
                  )}
                >
                  <div className="grid gap-2 md:grid-cols-[minmax(0,2.15fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.8fr)] md:items-center lg:gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <NextImage
                          src={person.avatarUrl}
                          alt={`${person.fullName} avatar`}
                          width={36}
                          height={36}
                          className="h-8 w-8 rounded-full border border-line object-cover lg:h-9 lg:w-9"
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
          "shell relative min-h-0 overflow-hidden rounded-2xl border border-line/70 p-3 sm:p-4 lg:h-full lg:p-6 xl:p-7",
          mobilePane === "list"
            ? "hidden lg:block"
            : "block h-[56dvh] sm:h-[60dvh] lg:h-full",
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
              nodeRelSize={Math.max(5, Math.round(nodeRadius * 0.45))}
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
                  ? "rgba(140, 29, 64, 0.48)"
                  : "rgba(15, 27, 42, 0.11)";
              }}
              onNodeClick={(node) => setSelectedId(getNodeId(node.id))}
              nodePointerAreaPaint={(node, color, ctx) => {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(
                  node.x ?? 0,
                  node.y ?? 0,
                  nodeRadius + 8,
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
                const radius = selected ? nodeRadius + 2 : nodeRadius;
                const image = getAvatarImage(person.avatarUrl);

                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2, false);
                ctx.closePath();
                ctx.clip();
                if (image) {
                  drawAvatarCover(ctx, image, x, y, radius);
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
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl border border-line/70 bg-surface/90 p-3 backdrop-blur-sm lg:bottom-4 lg:left-4 lg:right-4 lg:p-4">
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
  const trimmed = href.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    const host = url.host.toLowerCase();
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/g, "");
    return `${host}${path}${url.search}${url.hash}`;
  } catch {
    return trimmed
      .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
      .replace(/\/+$/g, "");
  }
}

function ProfileLinkIcon({ href, type, label, onClick }) {
  const [copied, setCopied] = useState(false);
  const Icon = copied ? Check : LINK_ICON_BY_TYPE[type] ?? LinkIcon;

  const handleEmailCopy = async (event) => {
    if (onClick) {
      onClick(event);
    }
    event.preventDefault();

    const email = extractEmailAddress(href);
    if (!email) {
      return;
    }

    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  if (type === "email") {
    return (
      <button
        type="button"
        title={copied ? "email copied" : "copy email"}
        aria-label={copied ? `${label} copied` : `copy ${label}`}
        onClick={handleEmailCopy}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full border text-muted transition hover:border-accent hover:bg-accent/10 hover:text-accent-ink",
          copied ? "border-accent/60 bg-accent/15 text-accent-ink" : "border-line",
        )}
      >
        <Icon className={LINK_ICON_CLASS} />
      </button>
    );
  }

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

function extractEmailAddress(href) {
  const trimmed = href.trim();
  if (!trimmed) {
    return "";
  }

  if (/^mailto:/i.test(trimmed)) {
    const rawEmail = trimmed.replace(/^mailto:/i, "").split("?")[0] ?? "";
    try {
      return decodeURIComponent(rawEmail).trim();
    } catch {
      return rawEmail.trim();
    }
  }

  return trimmed;
}

function drawAvatarCover(ctx, image, centerX, centerY, radius) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const diameter = radius * 2;

  if (!sourceWidth || !sourceHeight) {
    ctx.drawImage(image, centerX - radius, centerY - radius, diameter, diameter);
    return;
  }

  const sourceSize = Math.min(sourceWidth, sourceHeight);
  const sourceX = (sourceWidth - sourceSize) / 2;
  const sourceY = (sourceHeight - sourceSize) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    centerX - radius,
    centerY - radius,
    diameter,
    diameter,
  );
}
