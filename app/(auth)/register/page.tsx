"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, MapPin, Phone, TriangleAlert, UserRound } from "lucide-react";
import { Btn, Field, Select } from "@/components/ui";
import AuthCard from "@/components/auth/auth-card";
import DemoNote from "@/components/auth/demo-note";
import IconInput from "@/components/auth/icon-input";
import PasswordInput from "@/components/auth/password-input";
import { useAuth } from "@/lib/auth/auth-context";
import { describeApiError } from "@/lib/auth/api-client";
import { COUNTRIES, MIN_PASSWORD_LENGTH, isValidEmail } from "@/lib/auth/auth-utils";

/* ============================================================================
   School / Institution registration — POST /api/auth/register.
   ---------------------------------------------------------------------------
   Only a school registers itself here. The API creates the school, its first
   administrator and a free trial in one transaction, then returns a session, so
   the new admin is signed in as soon as the call succeeds.

   Students and employees are added later from inside the Admin Panel, so this
   form deliberately stays short and focused on the account owner.
   ========================================================================== */

const EMPTY_FORM = {
  schoolName: "",
  ownerName: "",
  email: "",
  phone: "",
  country: "Pakistan",
  city: "",
  password: "",
  confirmPassword: "",
};

/* The API answers a 400 with a flat `errors` list (e.g. "email is required",
   "passwords do not match"). Map each message back to the field it belongs to
   so the existing inline error UI can show it in place. */
const SERVER_ERROR_FIELDS: Array<[RegExp, keyof typeof EMPTY_FORM]> = [
  [/do not match|must match/i, "confirmPassword"],
  [/school/i, "schoolName"],
  [/email/i, "email"],
  [/phone/i, "phone"],
  [/city/i, "city"],
  [/country/i, "country"],
  [/password/i, "password"],
  [/name/i, "ownerName"],
];

export default function RegisterPage() {
  const router = useRouter();
  const { registerSchool } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const set = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.schoolName.trim()) next.schoolName = "Enter the school or institution name.";
    if (!form.ownerName.trim()) next.ownerName = "Enter the name of the account owner.";
    if (!isValidEmail(form.email)) next.email = "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a valid phone number.";
    if (!form.city.trim()) next.city = "Enter the city.";
    if (form.password.length < MIN_PASSWORD_LENGTH) next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords do not match.";
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    setPending(true);

    try {
      // Real call: creates the school + admin + trial and signs the admin in.
      await registerSchool({
        schoolName: form.schoolName.trim(),
        name: form.ownerName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country: form.country,
        city: form.city.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      router.replace("/register/verified");
    } catch (err) {
      const { message, errors: serverErrors } = describeApiError(err);

      // Highlight the fields the API complained about (e.g. 409 EMAIL_IN_USE).
      const mapped: Record<string, string> = {};
      for (const problem of serverErrors) {
        const match = SERVER_ERROR_FIELDS.find(([pattern]) => pattern.test(problem));
        if (match) mapped[match[1]] = problem;
      }
      setErrors(mapped);
      setFormError(message);
      setPending(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <span className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--theme-danger-text)]">
        <TriangleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
        {errors[key]}
      </span>
    ) : null;

  return (
    <AuthCard
      title="Create your school account"
      subtitle="Set up BisonsEduCore360 for your institution. You can add students, teachers and staff right after."
      footer={
        <span className="text-[var(--theme-text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]">
            Sign In
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="School / Institution Name" className="sm:col-span-2">
            <IconInput
              icon={Building2}
              name="schoolName"
              placeholder="e.g. Bisons Grammar School"
              value={form.schoolName}
              onChange={(e) => set("schoolName", e.target.value)}
            />
            {fieldError("schoolName")}
          </Field>

          <Field label="Admin / Owner Name" className="sm:col-span-2">
            <IconInput
              icon={UserRound}
              name="ownerName"
              autoComplete="name"
              placeholder="e.g. Amara Reyes"
              value={form.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
            />
            {fieldError("ownerName")}
          </Field>

          <Field label="Email Address">
            <IconInput
              icon={Mail}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@school.edu"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {fieldError("email")}
          </Field>

          <Field label="Phone Number">
            <IconInput
              icon={Phone}
              type="tel"
              name="phone"
              autoComplete="tel"
              placeholder="+92 300 1234567"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            {fieldError("phone")}
          </Field>

          <Field label="Country">
            <Select
              options={COUNTRIES}
              name="country"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
            />
          </Field>

          <Field label="City">
            <IconInput
              icon={MapPin}
              name="city"
              placeholder="e.g. Lahore"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
            {fieldError("city")}
          </Field>

          <Field label="Password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
            <PasswordInput
              icon={Lock}
              name="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
            {fieldError("password")}
          </Field>

          <Field label="Confirm Password">
            <PasswordInput
              icon={Lock}
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
            />
            {fieldError("confirmPassword")}
          </Field>
        </div>

        {formError && (
          <p role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
            <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            {formError}
          </p>
        )}

        <Btn
          type="submit"
          variant="primary"
          size="lg"
          loading={pending}
          loadingLabel="Creating account…"
          className="mt-6 w-full"
        >
          Create School Account
        </Btn>
      </form>

      <DemoNote>
        Your school account is created on the server and starts a free trial. Your password is stored
        hashed and is never kept in this browser.
      </DemoNote>
    </AuthCard>
  );
}
