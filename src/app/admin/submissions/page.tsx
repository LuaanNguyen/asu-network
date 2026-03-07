"use client";

import NextImage from "next/image";
import { useMemo, useState } from "react";

type EditablePayload = {
  fullName: string;
  asuProgram: string;
  gradYear: string;
  headline: string;
  bio: string;
  email: string;
  github: string;
  linkedin: string;
  x: string;
  site: string;
  avatarDataUrl: string;
};

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
  payloadValid: boolean;
  payload: EditablePayload;
};

type AdminSubmissionsResponse = {
  data?: Array<Partial<AdminSubmission> & { payload?: Partial<EditablePayload> | null }>;
  error?: string;
};

type AdminPerson = {
  id: number;
  slug: string;
  fullName: string;
  program: string;
  gradYear: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  avatarDataUrl: string;
  email: string;
  github: string;
  linkedin: string;
  site: string;
  x: string;
  isPublished: boolean;
  linkCount: number;
  createdAt: string | null;
};

type AdminPeopleResponse = {
  data?: Array<Partial<AdminPerson>>;
  total?: number;
  error?: string;
};

const EMPTY_EDITABLE_PAYLOAD: EditablePayload = {
  fullName: "",
  asuProgram: "",
  gradYear: "",
  headline: "",
  bio: "",
  email: "",
  github: "",
  linkedin: "",
  x: "",
  site: "",
  avatarDataUrl: "",
};

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const SUPPORTED_IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif",
];
const IMAGE_INPUT_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";

export default function AdminSubmissionsPage() {
  const [token, setToken] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [peopleRows, setPeopleRows] = useState<AdminPerson[]>([]);
  const [peopleTotal, setPeopleTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [savingPersonId, setSavingPersonId] = useState<number | null>(null);
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
        | AdminSubmissionsResponse
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "failed to load submissions");
      }

      const normalizedRows = Array.isArray(payload?.data)
        ? payload.data
            .map(normalizeSubmission)
            .filter((entry) => Number.isInteger(entry.id) && entry.id > 0)
        : [];

      setSubmissions(normalizedRows);
      setMessage("submissions loaded.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  async function loadPeople() {
    if (!token.trim()) {
      setError("enter admin token first.");
      return;
    }
    setPeopleLoading(true);
    setError("");
    setMessage("");

    try {
      const params = new URLSearchParams({
        limit: "300",
      });
      const query = peopleQuery.trim();
      if (query.length > 0) {
        params.set("q", query);
      }

      const response = await fetch(`/api/admin/people?${params.toString()}`, {
        headers: {
          "x-admin-token": token.trim(),
        },
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | AdminPeopleResponse
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "failed to load people");
      }

      const normalized = Array.isArray(payload?.data)
        ? payload.data
            .map(normalizeAdminPerson)
            .filter((entry) => Number.isInteger(entry.id) && entry.id > 0)
        : [];
      setPeopleRows(normalized);
      setPeopleTotal(Number(payload?.total ?? normalized.length));
      setMessage("people loaded.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "failed to load people");
    } finally {
      setPeopleLoading(false);
    }
  }

  async function removePerson(person: AdminPerson) {
    if (!token.trim()) {
      setError("enter admin token first.");
      return;
    }

    const confirmed = window.confirm(
      `remove ${person.fullName} from people? this cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/people/${person.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": token.trim(),
        },
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; deleted?: boolean }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "failed to remove person");
      }

      setPeopleRows((current) => current.filter((entry) => entry.id !== person.id));
      setPeopleTotal((current) => Math.max(0, current - 1));
      setMessage("person removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "failed to remove person");
    }
  }

  function updatePersonField<Key extends keyof AdminPerson>(
    personId: number,
    key: Key,
    value: AdminPerson[Key],
  ) {
    setPeopleRows((current) =>
      current.map((entry) =>
        entry.id === personId ? { ...entry, [key]: value } : entry,
      ),
    );
  }

  async function onPersonAvatarFileChange(personId: number, file: File | null) {
    if (!file) {
      updatePersonField(personId, "avatarDataUrl", "");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError("image too large. max file size is 2mb.");
      return;
    }

    if (!isSupportedImageFile(file)) {
      setError("unsupported image format. use png, jpg, webp, gif, or avif.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      updatePersonField(personId, "avatarDataUrl", dataUrl);
      setError("");
      setMessage("new profile photo ready. click save.");
    } catch {
      setError("could not read selected image.");
    }
  }

  async function savePerson(person: AdminPerson) {
    if (!token.trim()) {
      setError("enter admin token first.");
      return;
    }

    setSavingPersonId(person.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/people/${person.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token.trim(),
        },
        body: JSON.stringify({
          fullName: person.fullName,
          asuProgram: person.program,
          gradYear: person.gradYear,
          headline: person.headline,
          bio: person.bio,
          email: person.email,
          github: person.github,
          linkedin: person.linkedin,
          site: person.site,
          x: person.x,
          avatarDataUrl: person.avatarDataUrl,
          avatarUrl: person.avatarUrl,
          isPublished: person.isPublished,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            fullName?: string;
            program?: string;
            gradYear?: number | null;
            headline?: string;
            bio?: string;
            avatarUrl?: string;
            isPublished?: boolean;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "failed to save person");
      }

      setPeopleRows((current) =>
        current.map((entry) =>
          entry.id === person.id
            ? {
                ...entry,
                fullName: toSafeString(payload?.fullName) || entry.fullName,
                program: toSafeString(payload?.program) || entry.program,
                gradYear:
                  payload?.gradYear == null
                    ? ""
                    : String(payload.gradYear),
                headline: toSafeString(payload?.headline) || entry.headline,
                bio: toSafeString(payload?.bio) || entry.bio,
                avatarUrl: toSafeString(payload?.avatarUrl) || entry.avatarUrl,
                isPublished:
                  typeof payload?.isPublished === "boolean"
                    ? payload.isPublished
                    : entry.isPublished,
                avatarDataUrl: "",
              }
            : entry,
        ),
      );
      setMessage(`${person.fullName} updated.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "failed to save person");
    } finally {
      setSavingPersonId((current) => (current === person.id ? null : current));
    }
  }

  function updatePayloadField<Key extends keyof EditablePayload>(
    submissionId: number,
    key: Key,
    value: EditablePayload[Key],
  ) {
    setSubmissions((current) =>
      current.map((entry) =>
        entry.id === submissionId
          ? { ...entry, payload: { ...entry.payload, [key]: value } }
          : entry,
      ),
    );
  }

  async function moderateSubmission(
    submission: AdminSubmission,
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

    const payloadOverride =
      action === "approve"
        ? {
            ...submission.payload,
            gradYear: submission.payload.gradYear.trim(),
          }
        : undefined;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token.trim(),
        },
        body: JSON.stringify({
          action,
          reviewNotes,
          payloadOverride,
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
          review incoming join requests. you can edit and format fields before approving.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs tracking-[0.14em] text-muted">admin token</span>
            <input
              type="password"
              value={token}
              onChange={(event) => {
                const nextToken = event.currentTarget.value;
                setToken(nextToken);
              }}
              className="h-11 rounded-xl border border-line/80 bg-white px-4 text-sm outline-none ring-accent transition focus:ring-2"
              placeholder="paste admin token"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs tracking-[0.14em] text-muted">status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                const nextFilter = event.currentTarget.value as
                  | "pending"
                  | "approved"
                  | "rejected"
                  | "all";
                setStatusFilter(nextFilter);
              }}
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
          submissions.map((submission) => {
            const locked = submission.status !== "pending";
            return (
              <article
                key={submission.id}
                className="rounded-xl border border-line/70 bg-surface p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">
                      {submission.payload.fullName || "(no name)"}
                    </p>
                    <p className="text-sm text-muted">
                      {submission.payload.asuProgram || "(no program)"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {submission.payload.email || submission.email}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p>id: {submission.id}</p>
                    <p>status: {submission.status}</p>
                    <p>avatar: {submission.hasAvatar ? "uploaded" : "none"}</p>
                  </div>
                </div>

                {!submission.payloadValid ? (
                  <p className="mt-3 text-xs text-amber-700">
                    payload was invalid from source. please review all fields before approving.
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <EditableInput
                    label="full name"
                    value={submission.payload.fullName}
                    disabled={locked}
                    onChange={(value) =>
                      updatePayloadField(submission.id, "fullName", value)
                    }
                  />
                  <EditableInput
                    label="email"
                    value={submission.payload.email}
                    disabled={locked}
                    onChange={(value) =>
                      updatePayloadField(submission.id, "email", value)
                    }
                  />
                  <EditableInput
                    label="asu program"
                    value={submission.payload.asuProgram}
                    disabled={locked}
                    onChange={(value) =>
                      updatePayloadField(submission.id, "asuProgram", value)
                    }
                  />
                  <EditableInput
                    label="grad year"
                    value={submission.payload.gradYear}
                    disabled={locked}
                    inputMode="numeric"
                    onChange={(value) =>
                      updatePayloadField(
                        submission.id,
                        "gradYear",
                        value.replace(/[^\d]/g, "").slice(0, 4),
                      )
                    }
                  />
                </div>

                <div className="mt-3">
                  <EditableInput
                    label="headline"
                    value={submission.payload.headline}
                    disabled={locked}
                    onChange={(value) =>
                      updatePayloadField(submission.id, "headline", value)
                    }
                  />
                </div>

                <div className="mt-3">
                  <EditableTextArea
                    label="bio"
                    value={submission.payload.bio}
                    disabled={locked}
                    onChange={(value) =>
                      updatePayloadField(submission.id, "bio", value)
                    }
                  />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <EditableInput
                    label="github"
                    value={submission.payload.github}
                    disabled={locked}
                    onChange={(value) =>
                      updatePayloadField(submission.id, "github", value)
                    }
                  />
                  <EditableInput
                    label="linkedin"
                    value={submission.payload.linkedin}
                    disabled={locked}
                    onChange={(value) =>
                      updatePayloadField(submission.id, "linkedin", value)
                    }
                  />
                  <EditableInput
                    label="site"
                    value={submission.payload.site}
                    disabled={locked}
                    onChange={(value) =>
                      updatePayloadField(submission.id, "site", value)
                    }
                  />
                  <EditableInput
                    label="x"
                    value={submission.payload.x}
                    disabled={locked}
                    onChange={(value) =>
                      updatePayloadField(submission.id, "x", value)
                    }
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moderateSubmission(submission, "approve")}
                    disabled={locked}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    approve with edits
                  </button>
                  <button
                    type="button"
                    onClick={() => moderateSubmission(submission, "reject")}
                    disabled={locked}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-red-600 px-4 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    reject
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="rounded-2xl border border-line/70 bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display-heading text-2xl">people in db</h2>
            <p className="mt-1 text-sm text-muted">
              edit members, replace photos, and remove profiles.
            </p>
          </div>
          <p className="text-xs text-muted">{peopleRows.length} loaded · {peopleTotal} total</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_auto]">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs tracking-[0.14em] text-muted">search people</span>
            <input
              value={peopleQuery}
              onChange={(event) => {
                const query = event.currentTarget.value;
                setPeopleQuery(query);
              }}
              placeholder="name, program, headline"
              className="h-11 rounded-xl border border-line/80 bg-white px-4 text-sm outline-none ring-accent transition focus:ring-2"
            />
          </label>
          <button
            type="button"
            onClick={loadPeople}
            disabled={peopleLoading}
            className="mt-auto inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-accent-ink disabled:opacity-70"
          >
            {peopleLoading ? "loading..." : "load people"}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {peopleRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface-strong/30 p-5 text-sm text-muted">
              no people loaded yet.
            </div>
          ) : (
            peopleRows.map((person) => (
              <article
                key={person.id}
                className="rounded-xl border border-line/70 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <NextImage
                      src={
                        person.avatarDataUrl ||
                        person.avatarUrl ||
                        `https://api.dicebear.com/9.x/personas/png?seed=${encodeURIComponent(
                          person.fullName || person.slug || "member",
                        )}`
                      }
                      alt={`${person.fullName || "member"} avatar`}
                      width={44}
                      height={44}
                      unoptimized
                      className="h-11 w-11 rounded-full border border-line object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{person.fullName}</p>
                      <p className="truncate text-xs text-muted">
                        {person.slug} · id {person.id} · links {person.linkCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => savePerson(person)}
                      disabled={savingPersonId === person.id}
                      className="inline-flex h-8 items-center justify-center rounded-full bg-foreground px-3 text-xs font-semibold text-background transition hover:bg-accent-ink disabled:opacity-70"
                    >
                      {savingPersonId === person.id ? "saving..." : "save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removePerson(person)}
                      className="inline-flex h-8 items-center justify-center rounded-full bg-red-600 px-3 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      remove
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <EditableInput
                    label="full name"
                    value={person.fullName}
                    disabled={savingPersonId === person.id}
                    onChange={(value) => updatePersonField(person.id, "fullName", value)}
                  />
                  <EditableInput
                    label="email"
                    value={person.email}
                    disabled={savingPersonId === person.id}
                    onChange={(value) => updatePersonField(person.id, "email", value)}
                  />
                  <EditableInput
                    label="asu program"
                    value={person.program}
                    disabled={savingPersonId === person.id}
                    onChange={(value) => updatePersonField(person.id, "program", value)}
                  />
                  <EditableInput
                    label="grad year"
                    value={person.gradYear}
                    disabled={savingPersonId === person.id}
                    inputMode="numeric"
                    onChange={(value) =>
                      updatePersonField(
                        person.id,
                        "gradYear",
                        value.replace(/[^\d]/g, "").slice(0, 4),
                      )
                    }
                  />
                </div>

                <div className="mt-3">
                  <EditableInput
                    label="headline"
                    value={person.headline}
                    disabled={savingPersonId === person.id}
                    onChange={(value) => updatePersonField(person.id, "headline", value)}
                  />
                </div>

                <div className="mt-3">
                  <EditableTextArea
                    label="bio"
                    value={person.bio}
                    disabled={savingPersonId === person.id}
                    onChange={(value) => updatePersonField(person.id, "bio", value)}
                  />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <EditableInput
                    label="github"
                    value={person.github}
                    disabled={savingPersonId === person.id}
                    onChange={(value) => updatePersonField(person.id, "github", value)}
                  />
                  <EditableInput
                    label="linkedin"
                    value={person.linkedin}
                    disabled={savingPersonId === person.id}
                    onChange={(value) => updatePersonField(person.id, "linkedin", value)}
                  />
                  <EditableInput
                    label="site"
                    value={person.site}
                    disabled={savingPersonId === person.id}
                    onChange={(value) => updatePersonField(person.id, "site", value)}
                  />
                  <EditableInput
                    label="x"
                    value={person.x}
                    disabled={savingPersonId === person.id}
                    onChange={(value) => updatePersonField(person.id, "x", value)}
                  />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] lowercase tracking-[0.14em] text-muted">
                      replace photo
                    </span>
                    <input
                      type="file"
                      accept={IMAGE_INPUT_ACCEPT}
                      disabled={savingPersonId === person.id}
                      onChange={(event) =>
                        onPersonAvatarFileChange(
                          person.id,
                          event.currentTarget.files?.[0] ?? null,
                        )
                      }
                      className="h-10 rounded-xl border border-line/80 bg-white px-2 py-2 text-xs outline-none ring-accent transition file:mr-2 file:rounded-lg file:border-0 file:bg-surface-strong/50 file:px-2 file:py-1 file:text-[11px] file:font-medium focus:ring-2 disabled:cursor-not-allowed"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] lowercase tracking-[0.14em] text-muted">
                      published
                    </span>
                    <select
                      value={person.isPublished ? "yes" : "no"}
                      disabled={savingPersonId === person.id}
                      onChange={(event) =>
                        updatePersonField(
                          person.id,
                          "isPublished",
                          event.currentTarget.value === "yes",
                        )
                      }
                      className="h-10 rounded-xl border border-line/80 bg-white px-3 text-sm outline-none ring-accent transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-strong/30"
                    >
                      <option value="yes">yes</option>
                      <option value="no">no</option>
                    </select>
                  </label>
                </div>

                {person.avatarDataUrl ? (
                  <p className="mt-2 text-xs text-emerald-700">
                    new photo selected. click save to apply.
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted">
                  {person.email || "(no email link)"} ·{" "}
                  {person.isPublished ? "published" : "hidden"}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function EditableInput({
  label,
  value,
  onChange,
  disabled,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] lowercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        value={value}
        inputMode={inputMode}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          onChange(nextValue);
        }}
        className="h-10 rounded-xl border border-line/80 bg-white px-3 text-sm outline-none ring-accent transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-strong/30"
      />
    </label>
  );
}

function EditableTextArea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] lowercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          onChange(nextValue);
        }}
        className="min-h-24 rounded-xl border border-line/80 bg-white px-3 py-2 text-sm outline-none ring-accent transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-strong/30"
      />
    </label>
  );
}

function normalizeSubmission(
  entry: Partial<AdminSubmission> & { payload?: Partial<EditablePayload> | null },
): AdminSubmission {
  const payload = normalizeEditablePayload(entry.payload);
  return {
    id: Number(entry.id ?? 0),
    status:
      entry.status === "approved" || entry.status === "rejected"
        ? entry.status
        : "pending",
    email: toSafeString(entry.email),
    submittedAt: typeof entry.submittedAt === "string" ? entry.submittedAt : null,
    reviewedAt: typeof entry.reviewedAt === "string" ? entry.reviewedAt : null,
    reviewNotes: toSafeString(entry.reviewNotes),
    fullName: toSafeString(entry.fullName),
    asuProgram: toSafeString(entry.asuProgram),
    headline: toSafeString(entry.headline),
    hasAvatar: Boolean(entry.hasAvatar),
    payloadValid: entry.payloadValid !== false,
    payload,
  };
}

function normalizeEditablePayload(
  payload: Partial<EditablePayload> | null | undefined,
): EditablePayload {
  return {
    ...EMPTY_EDITABLE_PAYLOAD,
    fullName: toSafeString(payload?.fullName),
    asuProgram: toSafeString(payload?.asuProgram),
    gradYear: toSafeString(payload?.gradYear),
    headline: toSafeString(payload?.headline),
    bio: toSafeString(payload?.bio),
    email: toSafeString(payload?.email),
    github: toSafeString(payload?.github),
    linkedin: toSafeString(payload?.linkedin),
    x: toSafeString(payload?.x),
    site: toSafeString(payload?.site),
    avatarDataUrl: toSafeString(payload?.avatarDataUrl),
  };
}

function normalizeAdminPerson(entry: Partial<AdminPerson>): AdminPerson {
  const gradYearRaw = entry.gradYear;
  return {
    id: Number(entry.id ?? 0),
    slug: toSafeString(entry.slug),
    fullName: toSafeString(entry.fullName),
    program: toSafeString(entry.program),
    gradYear:
      typeof gradYearRaw === "number"
        ? String(gradYearRaw)
        : toSafeString(gradYearRaw),
    headline: toSafeString(entry.headline),
    bio: toSafeString(entry.bio),
    avatarUrl: toSafeString(entry.avatarUrl),
    avatarDataUrl: "",
    email: toSafeString(entry.email),
    github: toSafeString(entry.github),
    linkedin: toSafeString(entry.linkedin),
    site: toSafeString(entry.site),
    x: toSafeString(entry.x),
    isPublished: entry.isPublished !== false,
    linkCount: Number(entry.linkCount ?? 0),
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : null,
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("file read failed"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

function isSupportedImageFile(file: File) {
  const mime = file.type.trim().toLowerCase();
  if (mime.length > 0) {
    return SUPPORTED_IMAGE_MIME_TYPES.has(mime);
  }

  const name = file.name.toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.some((extension) => name.endsWith(extension));
}

function toSafeString(value: unknown) {
  return typeof value === "string" ? value : "";
}
