"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import StudentForm from "../student-form";
import AplInstituteAdmissionForm from "@/components/admissions/apl-institute-admission-form";
import { PageHeader } from "@/components/ui";
import { describeApiError, schoolApi, type AdmissionFormConfig } from "@/lib/auth/api-client";
import { APL_CATEGORIES, isAplCategory, isAplVariant, isNursingTrack, looksLikeAplSchool, NURSING_TRACKS } from "@/lib/apl-admission";
import { useAuth } from "@/lib/auth/auth-context";

function AplCategoryPicker({ instituteTitle }: { instituteTitle: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const choose = (category: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("category", category);
    router.push(`/students/new?${next.toString()}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-10">
      <PageHeader
        title="Admission category"
        subtitle={`${instituteTitle} — choose the form for this admission. Other schools keep the standard form.`}
        back={
          <Link
            href="/students"
            className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        }
      />
      <div className="grid gap-3 px-4 sm:grid-cols-3 sm:px-6">
        {APL_CATEGORIES.map((category, index) => (
          <button
            key={category.id}
            type="button"
            onClick={() => choose(category.id)}
            className="flex flex-col items-start gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-left shadow-sm transition hover:border-[var(--theme-primary)] hover:bg-[var(--theme-hover)]"
          >
            <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">
              {index + 1}
            </span>
            <span className="text-[18px] font-bold text-[var(--theme-text)]">{category.title}</span>
            <span className="text-[13px] leading-5 text-[var(--theme-text-muted)]">{category.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NursingTrackPicker({ instituteTitle }: { instituteTitle: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const choose = (track: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("category", "nursing");
    next.set("track", track);
    router.push(`/students/new?${next.toString()}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <PageHeader
        title="Nursing form"
        subtitle={`${instituteTitle} — choose the program so the admission is saved as the right form.`}
        back={
          <Link
            href="/students/new"
            className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        }
      />
      <div className="grid gap-3 px-4 sm:grid-cols-2 sm:px-6">
        {NURSING_TRACKS.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => choose(track.id)}
            className="flex flex-col items-start gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-left shadow-sm transition hover:border-[var(--theme-primary)] hover:bg-[var(--theme-hover)]"
          >
            <span className="text-[18px] font-bold text-[var(--theme-text)]">{track.title}</span>
            <span className="text-[13px] font-semibold text-[var(--theme-primary)]">{track.duration}</span>
            <span className="text-[13px] leading-5 text-[var(--theme-text-muted)]">{track.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NewAdmissionRouter() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const selectedTrack = searchParams.get("track");
  const [config, setConfig] = useState<AdmissionFormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await schoolApi.getAdmissionFormConfig();
        if (!cancelled) setConfig(res.config);
      } catch (err) {
        // Fallback: detect A+ by school name from session so form still works if API lags
        if (!cancelled) {
          if (looksLikeAplSchool(user?.school?.name, user?.school?.shortName)) {
            setConfig({
              variant: "apl-legal-it",
              instituteTitle: user?.school?.name || "A+ INSTITUTE IT & LAW",
              formTitle: "ADMISSION FORM",
              programs: [],
              documentChecklist: [],
              showQualificationTable: true,
              showFeeDetails: true,
              requireLatForLlb: true,
            });
          } else {
            setConfig({
              variant: "standard",
              instituteTitle: user?.school?.name || "",
              formTitle: "ADMISSION FORM",
              programs: [],
              documentChecklist: [],
              showQualificationTable: false,
              showFeeDetails: false,
              requireLatForLlb: false,
            });
            setError(describeApiError(err).message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.school?.name, user?.school?.shortName]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--theme-text-muted)]">
        Loading admission form…
      </div>
    );
  }

  if (config && isAplVariant(config.variant)) {
    if (!isAplCategory(selectedCategory)) {
      return <AplCategoryPicker instituteTitle={config.instituteTitle || user?.school?.name || "A Plus Institute"} />;
    }
    if (selectedCategory === "nursing" && !isNursingTrack(selectedTrack)) {
      return <NursingTrackPicker instituteTitle={config.instituteTitle || user?.school?.name || "A Plus Institute"} />;
    }
    return (
      <AplInstituteAdmissionForm
        config={config}
        category={selectedCategory}
        nursingTrackId={isNursingTrack(selectedTrack) ? selectedTrack : undefined}
      />
    );
  }

  return (
    <>
      {error ? (
        <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Using standard admission form ({error})
        </div>
      ) : null}
      <StudentForm />
    </>
  );
}

export default function AddStudentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm text-[var(--theme-text-muted)]">
          Loading…
        </div>
      }
    >
      <NewAdmissionRouter />
    </Suspense>
  );
}
