"use client";

import NextImage from "next/image";
import { useState } from "react";

import { submissionSchema } from "@/lib/validation/submission";

type JoinFormValues = {
  fullName: string;
  asuProgram: string;
  gradYear: string;
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
  gradYear: String(new Date().getFullYear() + 1),
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
  const updateValue = <Key extends keyof JoinFormValues>(
    key: Key,
    value: JoinFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  async function onAvatarFileChange(file: File | null) {
    if (!file) {
      updateValue("avatarDataUrl", "");
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
      updateValue("avatarDataUrl", dataUrl);
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

    if (!values.fullName.trim()) {
      setStatus("error");
      setMessage("full name is required.");
      return;
    }
    if (!values.email.trim()) {
      setStatus("error");
      setMessage("email is required.");
      return;
    }
    if (!values.asuProgram.trim()) {
      setStatus("error");
      setMessage("asu program is required.");
      return;
    }
    if (!values.gradYear.trim()) {
      setStatus("error");
      setMessage("grad year is required.");
      return;
    }

    const parsed = submissionSchema.safeParse({
      ...values,
      gradYear: values.gradYear.trim(),
    });
    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues[0]?.message ?? "please fix form errors.");
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
      setMessage("thanks. your profile request is in review.");
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
          onChange={(fullName) => updateValue("fullName", fullName)}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          value={values.email}
          required
          onChange={(email) => updateValue("email", email)}
        />
        <Field
          id="program"
          label="ASU Program"
          value={values.asuProgram}
          required
          onChange={(asuProgram) => updateValue("asuProgram", asuProgram)}
        />
        <Field
          id="gradYear"
          label="Grad Year"
          value={values.gradYear}
          required
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          onChange={(gradYear) => {
            const normalized = gradYear.replace(/[^\d]/g, "").slice(0, 4);
            updateValue("gradYear", normalized);
          }}
        />
      </div>

      <Field
        id="headline"
        label="Headline"
        value={values.headline}
        onChange={(headline) => updateValue("headline", headline)}
      />

      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs lowercase tracking-[0.16em] text-muted">Bio</span>
        <textarea
          className="min-h-28 rounded-xl border border-line/80 bg-white px-4 py-3 text-sm outline-none ring-accent transition focus:ring-2"
          value={values.bio}
          onChange={(event) => {
            const nextBio = event.currentTarget.value;
            updateValue("bio", nextBio);
          }}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <Field
          id="github"
          label="GitHub URL"
          value={values.github}
          onChange={(github) => updateValue("github", github)}
        />
        <Field
          id="linkedin"
          label="LinkedIn URL"
          value={values.linkedin}
          onChange={(linkedin) => updateValue("linkedin", linkedin)}
        />
        <Field
          id="site"
          label="Website URL"
          value={values.site}
          onChange={(site) => updateValue("site", site)}
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
        onChange={(event) => {
          const honeypotValue = event.currentTarget.value;
          updateValue("website", honeypotValue);
        }}
        className="hidden"
      />

      <label className="flex items-start gap-3 rounded-xl bg-surface-strong/40 p-4 text-sm">
        <input
          className="mt-1 h-4 w-4 rounded border-line text-accent"
          type="checkbox"
          checked={values.consent}
          onChange={(event) => {
            const isChecked = event.currentTarget.checked;
            updateValue("consent", isChecked);
          }}
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
  type?: "text" | "email";
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  pattern?: string;
  maxLength?: number;
};

function Field({
  id,
  label,
  value,
  onChange,
  required,
  type = "text",
  inputMode,
  pattern,
  maxLength,
}: FieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <span className="font-mono text-xs lowercase tracking-[0.16em] text-muted">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-11 rounded-xl border border-line/80 bg-white px-4 text-sm outline-none ring-accent transition focus:ring-2"
      />
    </label>
  );
}
