"use client";

import { Suspense, use, useEffect, useState } from "react";
import StudentForm from "../../student-form";
import AplInstituteAdmissionForm from "@/components/admissions/apl-institute-admission-form";
import { schoolApi, type AdmissionFormConfig } from "@/lib/auth/api-client";
import { isAplVariant, looksLikeAplSchool } from "@/lib/apl-admission";
import { useAuth } from "@/lib/auth/auth-context";

function EditAdmissionRouter({ studentId }: { studentId: string }) {
  const { user } = useAuth();
  const [config, setConfig] = useState<AdmissionFormConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await schoolApi.getAdmissionFormConfig();
        if (!cancelled) setConfig(res.config);
      } catch {
        if (!cancelled) {
          setConfig({
            variant: looksLikeAplSchool(user?.school?.name, user?.school?.shortName)
              ? "apl-legal-it"
              : "standard",
            instituteTitle: user?.school?.name || "A+ INSTITUTE IT & LAW",
            formTitle: "ADMISSION FORM",
            programs: [],
            documentChecklist: [],
            showQualificationTable: true,
            showFeeDetails: true,
            requireLatForLlb: true,
          });
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
    return (
      <Suspense fallback={null}>
        <AplInstituteAdmissionForm studentId={studentId} config={config} />
      </Suspense>
    );
  }

  return <StudentForm studentId={studentId} />;
}

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditAdmissionRouter studentId={id} />;
}
