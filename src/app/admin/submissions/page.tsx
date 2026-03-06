"use client";

import { useMemo, useState } from "react";

type AdminSubmission = {
  id: number;
  status: "pending" | "approved" | "rejected";
  email: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNotes: string;
  fullName: string;
  asuProgram: string;
  headline: string;
  hasAvatar: boolean;
};

export default function AdminSubmissionsPage() {
  const [token, setToken] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const pendingCount = useMemo(
    () => submissions.filter((entry) => entry.status === "pending").length,
    [submissions],
  );

  async function loadSubmissions() {
    if (!token.trim()) {
      setError("enter admin token first.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/submissions?status=${statusFilter}&limit=100`,
        {
          headers: {
            "x-admin-token": token.trim(),
          },
          cache: "no-store",
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { data?: AdminSubmission[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "failed to load submissions");
      }

      setSubmissions(Array.isArray(payload?.data) ? payload.data : []);
      setMessage("submissions loaded.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  async function moderateSubmission(
    submissionId: number,
    action: "approve" | "reject",
  ) {
    if (!token.trim()) {
      setError("enter admin token first.");
      return;
    }

    const reviewNotes =
      action === "reject"
        ? window.prompt("optional rejection note", "") ?? ""
        : "";

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token.trim(),
        },
        body: JSON.stringify({
          action,
          reviewNotes,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; status?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "moderation failed");
      }

      setMessage(
        action === "approve"
          ? "submission approved and published."
          : "submission rejected.",
      );
      await loadSubmissions();
    } catch (moderationError) {
      setError(
        moderationError instanceof Error
          ? moderationError.message
          : "moderation failed",
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-5 py-8 sm:px-8">
      <section className="rounded-2xl border border-line/70 bg-surface p-5 sm:p-6">
        <h1 className="display-heading text-3xl">admin submissions</h1>
        <p className="mt-2 text-sm text-muted">
          review incoming join requests and approve profiles for publication.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs tracking-[0.14em] text-muted">admin token</span>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.currentTarget.value)}
              className="h-11 rounded-xl border border-line/80 bg-white px-4 text-sm outline-none ring-accent transition focus:ring-2"
              placeholder="paste admin token"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs tracking-[0.14em] text-muted">status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.currentTarget.value as
                    | "pending"
                    | "approved"
                    | "rejected"
                    | "all",
                )
              }
              className="h-11 rounded-xl border border-line/80 bg-white px-4 text-sm outline-none ring-accent transition focus:ring-2"
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="all">all</option>
            </select>
          </label>

          <button
            type="button"
            onClick={loadSubmissions}
            disabled={loading}
            className="mt-auto inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-accent-ink disabled:opacity-70"
          >
            {loading ? "loading..." : "refresh"}
          </button>
        </div>

        <p className="mt-3 text-xs text-muted">
          {pendingCount} pending in current results.
        </p>

        {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="space-y-3">
        {submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-muted">
            no submissions loaded yet.
          </div>
        ) : (
          submissions.map((submission) => (
            <article
              key={submission.id}
              className="rounded-xl border border-line/70 bg-surface p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{submission.fullName}</p>
                  <p className="text-sm text-muted">{submission.asuProgram}</p>
                  <p className="mt-1 text-xs text-muted">{submission.email}</p>
                </div>
                <div className="text-right text-xs text-muted">
                  <p>id: {submission.id}</p>
                  <p>status: {submission.status}</p>
                  <p>avatar: {submission.hasAvatar ? "uploaded" : "none"}</p>
                </div>
              </div>

              <p className="mt-3 text-sm text-foreground/90">{submission.headline}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moderateSubmission(submission.id, "approve")}
                  disabled={submission.status !== "pending"}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  approve
                </button>
                <button
                  type="button"
                  onClick={() => moderateSubmission(submission.id, "reject")}
                  disabled={submission.status !== "pending"}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-red-600 px-4 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  reject
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
