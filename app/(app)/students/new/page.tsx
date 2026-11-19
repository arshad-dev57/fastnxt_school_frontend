"use client";

import { Suspense, useEffect, useState } from "react";
import StudentForm from "../student-form";
import AplInstituteAdmissionForm from "@/components/admissions/apl-institute-admission-form";
import { describeApiError, schoolApi, type AdmissionFormConfig } from "@/lib/auth/api-client";
import { isAplVariant } from "@/lib/apl-admission";
import { useAuth } from "@/lib/auth/auth-context";

function NewAdmissionRouter() {
  const { user } = useAuth();
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
          const name = `${user?.school?.name || ""} ${user?.school?.shortName || ""}`.toUpperCase();
          if (name.includes("IT & LAW") || name.includes("A+ INSTITUTE") || name.includes("IT AND LAW")) {
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
    return <AplInstituteAdmissionForm config={config} />;
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
