"use client";

import NextImage from "next/image";
import { useState } from "react";

import { submissionSchema } from "@/lib/validation/submission";

type JoinFormValues = {
  fullName: string;
  asuProgram: string;
  gradYear: number;
  headline: string;
  bio: string;
  email: string;
  consent: boolean;
  github: string;
  linkedin: string;
  site: string;
  avatarDataUrl: string;
  website: string;
};

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

const initialValues: JoinFormValues = {
  fullName: "",
  asuProgram: "",
  gradYear: new Date().getFullYear() + 1,
  headline: "",
  bio: "",
  github: "",
  linkedin: "",
  email: "",
  site: "",
  avatarDataUrl: "",
  website: "",
  consent: false,
};

export function JoinForm() {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onAvatarFileChange(file: File | null) {
    if (!file) {
      setValues((current) => ({ ...current, avatarDataUrl: "" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("please upload an image file.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setStatus("error");
      setMessage("image too large. max file size is 2mb.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setValues((current) => ({ ...current, avatarDataUrl: dataUrl }));
      setStatus("idle");
      setMessage("");
    } catch {
      setStatus("error");
      setMessage("could not read selected image.");
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    const parsed = submissionSchema.safeParse(values);
    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues[0]?.message ?? "Please fix form errors.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorPayload?.error ?? "submission failed");
      }

      setStatus("success");
      setMessage("Thanks. Your profile request is in review.");
      setValues(initialValues);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "could not submit right now. please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          id="fullName"
          label="Full Name"
          value={values.fullName}
          required
          onChange={(fullName) => setValues((current) => ({ ...current, fullName }))}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          value={values.email}
          required
          onChange={(email) => setValues((current) => ({ ...current, email }))}
        />
        <Field
          id="program"
          label="ASU Program"
          value={values.asuProgram}
          required
          onChange={(asuProgram) => setValues((current) => ({ ...current, asuProgram }))}
        />
        <Field
          id="gradYear"
          label="Grad Year"
          type="number"
          value={String(values.gradYear)}
          required
          onChange={(gradYear) =>
            setValues((current) => ({ ...current, gradYear: Number(gradYear) || current.gradYear }))
          }
        />
      </div>

      <Field
        id="headline"
        label="Headline"
        value={values.headline}
        required
        onChange={(headline) => setValues((current) => ({ ...current, headline }))}
      />

      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs lowercase tracking-[0.16em] text-muted">Bio</span>
        <textarea
          className="min-h-28 rounded-xl border border-line/80 bg-white px-4 py-3 text-sm outline-none ring-accent transition focus:ring-2"
          value={values.bio}
          onChange={(event) => setValues((current) => ({ ...current, bio: event.currentTarget.value }))}
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <Field
          id="github"
          label="GitHub URL"
          value={values.github}
          onChange={(github) => setValues((current) => ({ ...current, github }))}
        />
        <Field
          id="linkedin"
          label="LinkedIn URL"
          value={values.linkedin}
          onChange={(linkedin) => setValues((current) => ({ ...current, linkedin }))}
        />
        <Field
          id="site"
          label="Website URL"
          value={values.site}
          onChange={(site) => setValues((current) => ({ ...current, site }))}
        />
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs lowercase tracking-[0.16em] text-muted">
          profile photo (optional, max 2mb)
        </span>
        <input
          id="profilePhoto"
          type="file"
          accept="image/*"
          onChange={(event) => onAvatarFileChange(event.currentTarget.files?.[0] ?? null)}
          className="h-11 rounded-xl border border-line/80 bg-white px-3 py-2 text-sm outline-none ring-accent transition focus:ring-2"
        />
        {values.avatarDataUrl ? (
          <NextImage
            src={values.avatarDataUrl}
            alt="selected profile preview"
            unoptimized
            width={56}
            height={56}
            className="h-14 w-14 rounded-full border border-line object-cover"
          />
        ) : null}
      </label>

      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        value={values.website}
        onChange={(event) =>
          setValues((current) => ({ ...current, website: event.currentTarget.value }))
        }
        className="hidden"
      />

      <label className="flex items-start gap-3 rounded-xl bg-surface-strong/40 p-4 text-sm">
        <input
          className="mt-1 h-4 w-4 rounded border-line text-accent"
          type="checkbox"
          checked={values.consent}
          onChange={(event) => setValues((current) => ({ ...current, consent: event.currentTarget.checked }))}
          required
        />
        I confirm this information can be publicly displayed on asu.network after moderation review.
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:bg-accent-ink disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Submitting..." : "Submit Profile"}
      </button>

      {status !== "idle" ? (
        <p
          className={
            status === "success"
              ? "text-sm font-medium text-emerald-700"
              : "text-sm font-medium text-red-700"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
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

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "email" | "number";
};

function Field({ id, label, value, onChange, required, type = "text" }: FieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <span className="font-mono text-xs lowercase tracking-[0.16em] text-muted">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-11 rounded-xl border border-line/80 bg-white px-4 text-sm outline-none ring-accent transition focus:ring-2"
      />
    </label>
  );
}
