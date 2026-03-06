"use client";

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
};

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
  consent: false,
};

export function JoinForm() {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        throw new Error("Submission failed");
      }

      setStatus("success");
      setMessage("Thanks. Your profile request is in review.");
      setValues(initialValues);
    } catch {
      setStatus("error");
      setMessage("Could not submit right now. Please try again.");
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
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Bio</span>
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
      <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{label}</span>
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
