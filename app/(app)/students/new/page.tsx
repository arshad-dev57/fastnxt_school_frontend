"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, User, GraduationCap, Users2, FileText, ImagePlus } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, PageHeader, Select, Textarea, Avatar, type IconType } from "@/components/ui";
import { classesApi, studentsApi, type ClassItem, type CreateStudentInput } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const GENDERS = ["Male", "Female"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SESSIONS = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];

export default function AddStudentPage() {
  const router = useRouter();
  const { currentBranchId } = useBranch();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    first: "",
    last: "",
    gender: "Male",
    dob: "",
    blood: "",
    photo: "",
    studentId: "",
    admissionNo: "",
    admissionDate: new Date().toISOString().slice(0, 10),
    session: "2025-2026",
    cls: "",
    section: "A",
    father: "",
    mother: "",
    guardian: "",
    phone: "",
    email: "",
    address: "",
    prevSchool: "",
    medical: "",
    notes: "",
  });

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoadingClasses(true);
        const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
        const res = await classesApi.list({ branchId: branchScope });
        const list = res.classes || [];
        setClasses(list);
        if (list.length > 0 && !f.cls) {
          setF((p) => ({
            ...p,
            cls: list[0].name,
            section: list[0].sections?.[0] || "A",
          }));
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
      } finally {
        setLoadingClasses(false);
      }
    }
    loadClasses();
  }, [currentBranchId]);

  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));
  const fullName = `${f.first} ${f.last}`.trim();

  const handleClassChange = (newClassName: string) => {
    const found = classes.find((c) => c.name === newClassName);
    set({
      cls: newClassName,
      section: found?.sections?.[0] || "A",
    });
  };

  const selectedClassObj = classes.find((c) => c.name === f.cls);
  const availableSections = selectedClassObj?.sections?.length ? selectedClassObj.sections : ["A", "B", "C", "D"];
  const classNames = classes.map((c) => c.name);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName) {
      alert("Please enter the student's name (first and/or last name).");
      return;
    }
    if (!f.cls) {
      alert("Please select a class for the student.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

      const payload: CreateStudentInput = {
        name: fullName,
        first: f.first.trim() || undefined,
        last: f.last.trim() || undefined,
        gender: f.gender,
        dob: f.dob || undefined,
        blood: f.blood || undefined,
        photo: f.photo || undefined,
        studentId: f.studentId.trim() || undefined,
        admissionNo: f.admissionNo.trim() || undefined,
        admissionDate: f.admissionDate || undefined,
        session: f.session,
        cls: f.cls,
        classId: selectedClassObj?.id || undefined,
        section: f.section,
        father: f.father.trim() || undefined,
        mother: f.mother.trim() || undefined,
        guardian: (f.guardian || f.father).trim() || undefined,
        phone: f.phone.trim() || undefined,
        email: f.email.trim() || undefined,
        address: f.address.trim() || undefined,
        prevSchool: f.prevSchool.trim() || undefined,
        medical: f.medical.trim() || undefined,
        notes: f.notes.trim() || undefined,
        status: "Active",
        branchId: branchScope,
      };

      await studentsApi.create(payload);
      router.push("/students");
    } catch (err: unknown) {
      console.error("Failed to create student:", err);
      setError(err instanceof Error ? err.message : "Failed to register student.");
    } finally {
      setSubmitting(false);
    }
  };

  const back = (
    <Link
      href="/students"
      className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]"
      aria-label="Back"
    >
      <ChevronLeft className="h-5 w-5" />
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Add New Student"
        subtitle="Register a new student with personal, academic and guardian details."
        back={back}
        actions={
          <Btn variant="primary" Icon={Save} onClick={() => handleSubmit()} disabled={submitting}>
            {submitting ? "Saving Student…" : "Save Student"}
          </Btn>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-5 xl:col-span-2">
          {error && (
            <div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-500">
              {error}
            </div>
          )}

          <Section icon={User} title="Personal Information" subtitle="Basic bio-data of the student">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First Name *">
                <Input value={f.first} onChange={(e) => set({ first: e.target.value })} placeholder="First name" required />
              </Field>
              <Field label="Last Name">
                <Input value={f.last} onChange={(e) => set({ last: e.target.value })} placeholder="Last name" />
              </Field>
              <Field label="Gender">
                <Select options={GENDERS} value={f.gender} onChange={(e) => set({ gender: e.target.value })} />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={f.dob} onChange={(e) => set({ dob: e.target.value })} />
              </Field>
              <Field label="Blood Group">
                <Select options={BLOOD_GROUPS} value={f.blood} onChange={(e) => set({ blood: e.target.value })} placeholder="Select blood group" />
              </Field>
              <Field label="Photo">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName || "New Student"} size={44} />
                  <label className="flex h-10 flex-1 cursor-pointer items-center gap-2 rounded border border-dashed border-[var(--theme-border-strong)] px-3 text-[13px] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]">
                    <ImagePlus className="h-4 w-4" /> {f.photo ? f.photo : "Upload photo name"}
                    <input type="text" className="hidden" />
                  </label>
                </div>
              </Field>
            </div>
          </Section>

          <Section icon={GraduationCap} title="Academic Information" subtitle="Class placement and admission details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Student ID (Auto if blank)">
                <Input value={f.studentId} onChange={(e) => set({ studentId: e.target.value })} placeholder="e.g. STD-1002" />
              </Field>
              <Field label="Admission Number (Auto if blank)">
                <Input value={f.admissionNo} onChange={(e) => set({ admissionNo: e.target.value })} placeholder="e.g. ADM-2026-0002" />
              </Field>
              <Field label="Admission Date">
                <Input type="date" value={f.admissionDate} onChange={(e) => set({ admissionDate: e.target.value })} />
              </Field>
              <Field label="Academic Session">
                <Select options={SESSIONS} value={f.session} onChange={(e) => set({ session: e.target.value })} />
              </Field>
              <Field label="Class *">
                <Select
                  options={classNames.length ? classNames : ["No classes found"]}
                  value={f.cls}
                  onChange={(e) => handleClassChange(e.target.value)}
                  placeholder={loadingClasses ? "Loading classes…" : "Select class"}
                  disabled={loadingClasses || classNames.length === 0}
                />
              </Field>
              <Field label="Section *">
                <Select options={availableSections} value={f.section} onChange={(e) => set({ section: e.target.value })} />
              </Field>
            </div>
          </Section>

          <Section icon={Users2} title="Parent / Guardian" subtitle="Contact and address information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Father Name">
                <Input value={f.father} onChange={(e) => set({ father: e.target.value })} placeholder="Father's full name" />
              </Field>
              <Field label="Mother Name">
                <Input value={f.mother} onChange={(e) => set({ mother: e.target.value })} placeholder="Mother's full name" />
              </Field>
              <Field label="Guardian Name">
                <Input value={f.guardian} onChange={(e) => set({ guardian: e.target.value })} placeholder="Guardian full name (defaults to father)" />
              </Field>
              <Field label="Phone / Mobile">
                <Input value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="03XX-XXXXXXX" />
              </Field>
              <Field label="Email" className="sm:col-span-2">
                <Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="guardian@email.com" />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Textarea value={f.address} onChange={(e) => set({ address: e.target.value })} placeholder="House, street, area, city" />
              </Field>
            </div>
          </Section>

          <Section icon={FileText} title="Additional Information" subtitle="Optional background and medical notes">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Previous School">
                <Input value={f.prevSchool} onChange={(e) => set({ prevSchool: e.target.value })} placeholder="School previously attended" />
              </Field>
              <Field label="Medical Information">
                <Textarea value={f.medical} onChange={(e) => set({ medical: e.target.value })} placeholder="Allergies, conditions, medication notes" />
              </Field>
              <Field label="Notes / Remarks">
                <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Any other admission or administrative remarks" />
              </Field>
            </div>
          </Section>
        </form>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Student summary" Icon={User} />
            <div className="flex flex-col items-center gap-2 border-b border-[var(--theme-border)] p-4">
              <Avatar name={fullName || "New Student"} size={64} />
              <p className="text-[16px] font-semibold">{fullName || "New Student"}</p>
              <p className="text-[13px] text-[var(--theme-text-muted)]">
                {f.cls || "Class"} - {f.section} · {f.gender}
              </p>
            </div>
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Student ID" value={f.studentId || "Auto-assigned"} />
              <Row label="Admission No" value={f.admissionNo || "Auto-assigned"} />
              <Row label="Admission Date" value={f.admissionDate} />
              <Row label="Session" value={f.session} />
              <Row label="Class & Sec" value={`${f.cls || '—'} (Sec ${f.section})`} />
              <Row label="Guardian" value={f.guardian || f.father || "—"} />
              <Row label="Phone" value={f.phone || "—"} />
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={() => handleSubmit()} disabled={submitting}>
              {submitting ? "Saving…" : "Save Student"}
            </Btn>
            <Btn variant="secondary" onClick={() => router.push("/students")} disabled={submitting}>
              Cancel
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: IconType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card pad={false}>
      <CardHead title={title} subtitle={subtitle} Icon={Icon} />
      <div className="p-4">{children}</div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-[var(--theme-text-muted)]">{label}</span>
      <span className="truncate font-medium text-[var(--theme-text)]">{value}</span>
    </div>
  );
}
