import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { createHash } from "node:crypto";

import { getDb } from "@/db/client";
import { submissions } from "@/db/schema";
import { env } from "@/lib/env/server";
import { consumeMemoryRateLimit } from "@/lib/server/rate-limit";
import { submissionSchema } from "@/lib/validation/submission";

const IP_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;
const IP_MAX_REQUESTS = 6;
const EMAIL_MAX_REQUESTS = 3;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const clientIp = getClientIp(request);
  const ipHash = hashIp(clientIp);
  const userAgent = request.headers.get("user-agent");
  const email = parsed.data.email.trim().toLowerCase();

  const db = getDb();
  if (!db) {
    const ipLimit = consumeMemoryRateLimit(`ip:${ipHash}`, IP_MAX_REQUESTS, IP_WINDOW_MS);
    if (!ipLimit.allowed) {
      return tooManyRequests(ipLimit.retryAfterSec);
    }

    const emailLimit = consumeMemoryRateLimit(
      `email:${email}`,
      EMAIL_MAX_REQUESTS,
      EMAIL_WINDOW_MS,
    );
    if (!emailLimit.allowed) {
      return tooManyRequests(emailLimit.retryAfterSec);
    }

    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        status: "received",
        source: "local",
        submittedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }

  try {
    const now = Date.now();
    const ipWindowStart = new Date(now - IP_WINDOW_MS);
    const emailWindowStart = new Date(now - EMAIL_WINDOW_MS);
    const [ipCountRows, emailCountRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(submissions)
        .where(
          and(
            eq(submissions.ipHash, ipHash),
            gte(submissions.submittedAt, ipWindowStart),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(submissions)
        .where(
          and(
            eq(submissions.email, email),
            gte(submissions.submittedAt, emailWindowStart),
          ),
        ),
    ]);

    const ipCount = Number(ipCountRows[0]?.count ?? 0);
    if (ipCount >= IP_MAX_REQUESTS) {
      return tooManyRequests(Math.ceil(IP_WINDOW_MS / 1000));
    }

    const emailCount = Number(emailCountRows[0]?.count ?? 0);
    if (emailCount >= EMAIL_MAX_REQUESTS) {
      return tooManyRequests(Math.ceil(EMAIL_WINDOW_MS / 1000));
    }

    const inserted = await db
      .insert(submissions)
      .values({
        payloadJson: JSON.stringify(parsed.data),
        email,
        ipHash,
        userAgent,
      })
      .returning({
        id: submissions.id,
        status: submissions.status,
        submittedAt: submissions.submittedAt,
      });

    const row = inserted[0];
    return NextResponse.json(
      {
        id: row?.id ?? crypto.randomUUID(),
        status: row?.status ?? "pending",
        source: "db",
        submittedAt: row?.submittedAt?.toISOString() ?? new Date().toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("failed to persist submission", error);
    return NextResponse.json(
      { error: "Could not store submission right now." },
      { status: 500 },
    );
  }
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return "unknown";
}

function hashIp(ip: string) {
  const salt = env.RATE_LIMIT_SALT ?? "dev-rate-limit-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function tooManyRequests(retryAfterSec: number) {
  return NextResponse.json(
    {
      error: "too many submissions. please wait and try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
