"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, User, GraduationCap, Users2, FileText, ImagePlus, Plus, Trash2 } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, PageHeader, Select, Textarea, Avatar, type IconType } from "@/components/ui";
import {
  classesApi,
  describeApiError,
  studentsApi,
  uploadsApi,
  type ClassItem,
  type CreateStudentInput,
  type StudentDocItem,
  type StudentItem,
} from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const GENDERS = ["Male", "Female"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SESSIONS = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];
const STATUSES = ["Active", "Inactive"];
const DOC_SUGGESTIONS = [
  "Birth Certificate",
  "B-Form / CRC",
  "CNIC / Form-B",
  "Previous School Leaving Certificate",
  "Character Certificate",
  "Medical Certificate",
  "Passport Copy",
  "Other",
];

type FormState = {
  first: string;
  last: string;
  gender: string;
  dob: string;
  blood: string;
  photo: string;
  studentId: string;
  admissionNo: string;
  admissionDate: string;
  session: string;
  cls: string;
  section: string;
  father: string;
  mother: string;
  guardian: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  prevSchool: string;
  medical: string;
  notes: string;
  status: string;
};

function splitName(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function blankForm(): FormState {
  return {
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
    password: "",
    address: "",
    prevSchool: "",
    medical: "",
    notes: "",
    status: "Active",
  };
}

function fromStudent(s: StudentItem): FormState {
  const { first, last } = splitName(s.name);
  return {
    first,
    last,
    gender: s.gender || "Male",
    dob: s.dob || "",
    blood: s.blood || "",
    photo: s.photo || "",
    studentId: s.studentId || "",
    admissionNo: s.admissionNo || "",
    admissionDate: s.admissionDate || new Date().toISOString().slice(0, 10),
    session: s.session || "2025-2026",
    cls: s.cls || "",
    section: s.section || "A",
    father: s.father || "",
    mother: s.mother || "",
    guardian: s.guardian || s.father || "",
    phone: s.phone || "",
    email: s.email || "",
    password: "",
    address: s.address || "",
    prevSchool: s.prevSchool || "",
    medical: s.medical || "",
    notes: s.notes || "",
    status: s.status || "Active",
  };
}

export default function StudentForm({ studentId }: { studentId?: string }) {
  const router = useRouter();
  const { currentBranchId } = useBranch();
  const isEdit = Boolean(studentId);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudent, setLoadingStudent] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<FormState>(blankForm);
  const [documents, setDocuments] = useState<StudentDocItem[]>([]);
  const [docLabel, setDocLabel] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoadingClasses(true);
        const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
        const res = await classesApi.list({ branchId: branchScope });
        const list = res.classes || [];
        setClasses(list);
        if (!isEdit && list.length > 0) {
          setF((p) =>
            p.cls
              ? p
              : {
                  ...p,
                  cls: list[0].name,
                  section: list[0].sections?.[0] || "A",
                },
          );
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
      } finally {
        setLoadingClasses(false);
      }
    }
    loadClasses();
  }, [currentBranchId, isEdit]);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingStudent(true);
        setError(null);
        const res = await studentsApi.get(studentId);
        if (!cancelled) {
          setF(fromStudent(res.student));
          setDocuments(res.student.documents || []);
        }
      } catch (err) {
        if (!cancelled) setError(describeApiError(err).message);
      } finally {
        if (!cancelled) setLoadingStudent(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const set = (patch: Partial<FormState>) => setF((p) => ({ ...p, ...patch }));
  const fullName = `${f.first} ${f.last}`.trim();

  const addDocument = async (file?: File | null) => {
    const label = docLabel.trim();
    if (!label) {
      alert("Enter what this document is (e.g. Birth Certificate, B-Form).");
      return;
    }
    if (!file) {
      alert("Choose a file to upload.");
      return;
    }
    setUploadingDoc(true);
    setError(null);
    try {
      const res = await uploadsApi.upload(file, { purpose: "student-doc", folder: "students/docs" });
      setDocuments((prev) => [
        ...prev,
        {
          id: `DOC-${Date.now()}-${prev.length}`,
          name: label,
          type: label,
          url: res.upload.url,
          publicId: res.upload.publicId,
          size: res.upload.size || res.upload.bytes || file.size || 0,
          uploadDate: new Date().toISOString().slice(0, 10),
        },
      ]);
      setDocLabel("");
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

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
        documents,
        status: f.status,
        branchId: branchScope,
      };

      if (!isEdit && f.password.trim()) {
        payload.password = f.password.trim();
      }

      if (isEdit && studentId) {
        await studentsApi.update(studentId, payload);
      } else {
        await studentsApi.create(payload);
      }
      router.push("/students");
    } catch (err: unknown) {
      console.error("Failed to save student:", err);
      setError(err instanceof Error ? err.message : "Failed to save student.");
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

  if (loadingStudent) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-[14px] text-[var(--theme-text-muted)]">
        Loading student…
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit Student" : "Add New Student"}
        subtitle={
          isEdit
            ? "Update personal, academic and guardian details for this student."
            : "Register a new student with personal, academic and guardian details."
        }
        back={back}
        actions={
          <Btn variant="primary" Icon={Save} onClick={() => handleSubmit()} disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Save Student"}
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
              {isEdit && (
                <Field label="Status">
                  <Select options={STATUSES} value={f.status} onChange={(e) => set({ status: e.target.value })} />
                </Field>
              )}
              <Field label="Photo">
                <div className="flex items-center gap-3">
                  {f.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.photo} alt="" className="h-11 w-11 rounded-full object-cover border border-[var(--theme-border)]" />
                  ) : (
                    <Avatar name={fullName || (isEdit ? "Student" : "New Student")} size={44} />
                  )}
                  <label className="flex h-10 flex-1 cursor-pointer items-center gap-2 rounded border border-dashed border-[var(--theme-border-strong)] px-3 text-[13px] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]">
                    <ImagePlus className="h-4 w-4" /> {f.photo ? "Change photo" : "Upload photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        try {
                          const res = await uploadsApi.upload(file, { purpose: "student-photo", folder: "students/photos" });
                          set({ photo: res.upload.url });
                        } catch (err) {
                          alert(describeApiError(err).message);
                        }
                      }}
                    />
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
                  options={classNames.length ? classNames : f.cls ? [f.cls] : ["No classes found"]}
                  value={f.cls}
                  onChange={(e) => handleClassChange(e.target.value)}
                  placeholder={loadingClasses ? "Loading classes…" : "Select class"}
                  disabled={loadingClasses || (classNames.length === 0 && !f.cls)}
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
              <Field label="Address" className="sm:col-span-2">
                <Textarea value={f.address} onChange={(e) => set({ address: e.target.value })} placeholder="House, street, area, city" />
              </Field>
            </div>
          </Section>

          <Section icon={Users2} title="Student panel login credentials" subtitle="These credentials create the student portal login (email + password)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Login email *">
                <Input
                  type="email"
                  value={f.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="student@school.com"
                />
              </Field>
              {!isEdit ? (
                <Field label="Login password">
                  <Input
                    type="password"
                    value={f.password}
                    onChange={(e) => set({ password: e.target.value })}
                    placeholder="Default if blank: Password123"
                  />
                </Field>
              ) : (
                <Field label="Password">
                  <Input value="Set on create — ask admin to reset via Users if needed" disabled />
                </Field>
              )}
              <p className="sm:col-span-2 text-[12px] text-[var(--theme-text-muted)]">
                After save, the student signs in at the Student Portal with this email. Leave password blank on create to use <span className="font-mono">Password123</span>.
              </p>
            </div>
          </Section>

          <Section icon={FileText} title="Documents & Certificates" subtitle="Upload multiple files and label each one yourself">
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3">
                <Field label="Document type / title *" className="min-w-[220px] flex-1">
                  <Input
                    value={docLabel}
                    onChange={(e) => setDocLabel(e.target.value)}
                    list="student-doc-suggestions"
                    placeholder="e.g. Birth Certificate, B-Form, SLC…"
                  />
                  <datalist id="student-doc-suggestions">
                    {DOC_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </Field>
                <label
                  className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded border border-[var(--theme-border)] px-3 text-[13px] hover:bg-[var(--theme-hover)] ${
                    uploadingDoc ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  {uploadingDoc ? "Uploading…" : "Upload file"}
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    disabled={uploadingDoc}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      e.target.value = "";
                      void addDocument(file);
                    }}
                  />
                </label>
              </div>

              {documents.length === 0 ? (
                <p className="text-[13px] italic text-[var(--theme-text-muted)]">No documents attached yet.</p>
              ) : (
                <div className="divide-y divide-[var(--theme-border)] rounded-lg border border-[var(--theme-border)]">
                  {documents.map((doc, idx) => (
                    <div key={doc.id || idx} className="flex items-center justify-between gap-3 p-3 text-[14px]">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{doc.name}</p>
                          <p className="text-[12px] text-[var(--theme-text-muted)]">
                            {doc.uploadDate}
                            {doc.url ? (
                              <>
                                {" · "}
                                <a
                                  href={uploadsApi.downloadHref({
                                    url: doc.url,
                                    publicId: doc.publicId,
                                    filename: doc.name || "document",
                                    resourceType: doc.url.includes("/raw/") ? "raw" : "image",
                                  })}
                                  className="text-[var(--theme-primary-soft-text)] hover:underline"
                                >
                                  Download
                                </a>
                              </>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <Btn size="sm" variant="ghost" Icon={Trash2} onClick={() => removeDocument(idx)} className="shrink-0 text-[var(--theme-danger)]">
                        Remove
                      </Btn>
                    </div>
                  ))}
                </div>
              )}
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
              <Avatar name={fullName || (isEdit ? "Student" : "New Student")} src={f.photo || null} size={64} />
              <p className="text-[16px] font-semibold">{fullName || (isEdit ? "Student" : "New Student")}</p>
              <p className="text-[13px] text-[var(--theme-text-muted)]">
                {f.cls || "Class"} - {f.section} · {f.gender}
              </p>
            </div>
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Student ID" value={f.studentId || "Auto-assigned"} />
              <Row label="Admission No" value={f.admissionNo || "Auto-assigned"} />
              <Row label="Admission Date" value={f.admissionDate} />
              <Row label="Session" value={f.session} />
              <Row label="Class & Sec" value={`${f.cls || "—"} (Sec ${f.section})`} />
              <Row label="Guardian" value={f.guardian || f.father || "—"} />
              <Row label="Phone" value={f.phone || "—"} />
              <Row label="Documents" value={`${documents.length} attached`} />
              {isEdit && <Row label="Status" value={f.status} />}
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={() => handleSubmit()} disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Save Student"}
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
