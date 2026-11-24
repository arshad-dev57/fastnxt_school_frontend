"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ImagePlus, Save } from "lucide-react";
import { Btn, PageHeader } from "@/components/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";
import { CoursePicker } from "@/components/courses/course-picker";
import {
  admissionsApi,
  coursesApi,
  describeApiError,
  studentsApi,
  uploadsApi,
  type AdmissionFormConfig,
  type CourseItem,
  type CreateStudentInput,
  type StudentAdmissionExtras,
  type StudentItem,
} from "@/lib/auth/api-client";
import {
  aplCategoryPreset,
  blankFees,
  blankQualifications,
  calcPercentage,
  isAplCategory,
  nursingTrack,
  NURSING_TRACKS,
  type AplAdmissionCategory,
  type AplFeeState,
  type AplQualificationRow,
} from "@/lib/apl-admission";

type FormState = {
  formNo: string;
  admissionDate: string;
  studentId: string;
  photo: string;
  name: string;
  father: string;
  cnic: string;
  guardianCnic: string;
  phone: string;
  altPhone: string;
  email: string;
  dob: string;
  address: string;
  programs: string[];
  programOther: string;
  course: string;
  courseId: string;
  nursingNote: string;
  qualifications: AplQualificationRow[];
  fees: AplFeeState;
  documentsChecklist: string[];
  documentOther: string;
  password: string;
  section: string;
  session: string;
  status: string;
};

function blankForm(session?: string, category: AplAdmissionCategory = "general", courseName = ""): FormState {
  return {
    formNo: "",
    admissionDate: new Date().toISOString().slice(0, 10),
    studentId: "",
    photo: "",
    name: "",
    father: "",
    cnic: "",
    guardianCnic: "",
    phone: "",
    altPhone: "",
    email: "",
    dob: "",
    address: "",
    programs: courseName ? [courseName] : [],
    programOther: "",
    course: courseName,
    courseId: "",
    nursingNote: "",
    qualifications: blankQualifications(aplCategoryPreset(category).qualificationLevels),
    fees: blankFees(),
    documentsChecklist: [],
    documentOther: "",
    password: "",
    section: "A",
    session: session || "2025-2026",
    status: "Active",
  };
}

function fromStudent(s: StudentItem, category: AplAdmissionCategory = "general"): FormState {
  const x = s.admissionExtras || {};
  const quals = blankQualifications(aplCategoryPreset(category).qualificationLevels).map((row) => {
    const found = (x.qualifications || []).find((q) => q.level === row.level);
    return found
      ? {
          level: row.level,
          board: found.board || "",
          year: found.year || "",
          totalMarks: found.totalMarks || "",
          obtainedMarks: found.obtainedMarks || "",
          percentage: found.percentage || "",
        }
      : row;
  });
  return {
    formNo: x.formNo || s.admissionNo || "",
    admissionDate: s.admissionDate || new Date().toISOString().slice(0, 10),
    studentId: s.studentId || "",
    photo: s.photo || "",
    name: s.name || "",
    father: s.father || s.guardian || "",
    cnic: x.cnic || "",
    guardianCnic: x.guardianCnic || "",
    phone: s.phone || "",
    altPhone: x.altPhone || "",
    email: s.email || "",
    dob: s.dob || "",
    address: s.address || "",
    programs: x.programs || (s.course ? [s.course] : s.cls ? [s.cls] : []),
    programOther: x.programOther || "",
    course: s.course || x.nursingProgram || "",
    courseId: s.courseId || "",
    nursingNote: x.nursingNote || "",
    qualifications: quals,
    fees: {
      ...blankFees(),
      ...(x.fees || {}),
    },
    documentsChecklist: x.documentsChecklist || [],
    documentOther: x.documentOther || "",
    password: "",
    section: s.section || "A",
    session: s.session || "2025-2026",
    status: s.status || "Active",
  };
}

function LineField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 items-end gap-2 border-b border-slate-300 pb-1 ${className}`}>
      <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full border-0 bg-transparent px-0 py-0.5 text-[14px] text-slate-900 outline-none placeholder:text-slate-400";

export default function AplInstituteAdmissionForm({
  studentId,
  config,
  category: categoryProp = "general",
  nursingTrackId,
}: {
  studentId?: string;
  config: AdmissionFormConfig;
  category?: AplAdmissionCategory;
  nursingTrackId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enquiryId = searchParams.get("enquiryId");
  const { user } = useAuth();
  const { currentBranchId } = useBranch();
  const isEdit = Boolean(studentId);
  const [category, setCategory] = useState<AplAdmissionCategory>(categoryProp);
  const preset = aplCategoryPreset(category);
  const initialTrack = nursingTrack(nursingTrackId);
  const [courses, setCourses] = useState<CourseItem[]>([]);

  const programs =
    category === "general" && config.programs?.length ? config.programs : preset.programs;
  const checklist =
    category === "general" && config.documentChecklist?.length
      ? config.documentChecklist
      : preset.documents;
  const requireLat = category === "general" && config.requireLatForLlb !== false && preset.requireLatForLlb;

  const [f, setF] = useState<FormState>(() => blankForm(undefined, categoryProp, initialTrack?.courseName || ""));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolTitle, setSchoolTitle] = useState(config.instituteTitle || user?.school?.name || "A+ INSTITUTE IT & LAW");

  const set = (patch: Partial<FormState>) => setF((p) => ({ ...p, ...patch }));

  const primaryProgram = useMemo(() => {
    if (category === "it" || category === "nursing") return f.course.trim();
    const selected = f.programs.filter((p) => p !== "Other");
    if (selected.length) return selected[0];
    if (f.programs.includes("Other") && f.programOther.trim()) return f.programOther.trim();
    return f.course.trim();
  }, [category, f.course, f.programs, f.programOther]);

  useEffect(() => {
    let cancelled = false;
    coursesApi.list()
      .then((res) => {
        if (!cancelled) setCourses(res.courses || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (studentId) {
          const res = await studentsApi.get(studentId);
          const saved = res.student.admissionExtras?.category;
          const nextCategory = isAplCategory(saved) ? saved : categoryProp;
          if (!cancelled) {
            setCategory(nextCategory);
            setF(fromStudent(res.student, nextCategory));
          }
          return;
        }

        const next = blankForm(undefined, categoryProp, initialTrack?.courseName || "");
        next.session = "2025-2026";

        // Prefill from logged-in user / linked student profile
        if (user) {
          if (user.panel === "student" || user.role === "Student") {
            try {
              const me = await studentsApi.me();
              if (!cancelled && me.student) {
                const saved = me.student.admissionExtras?.category;
                const nextCategory = isAplCategory(saved) ? saved : categoryProp;
                setCategory(nextCategory);
                setF(fromStudent(me.student, nextCategory));
                setSchoolTitle(config.instituteTitle || user.school?.name || schoolTitle);
                return;
              }
            } catch {
              /* fall through to auth user fields */
            }
            // Map login account → form fields when student profile not linked yet
            next.name = user.name || "";
            next.email = user.email || "";
          }
        }

        // Prefill from admission enquiry when converting a lead
        if (enquiryId) {
          try {
            const enq = await admissionsApi.get(enquiryId);
            const e = enq.enquiry;
            next.name = e.applicant || next.name;
            next.father = e.guardian || next.father;
            next.phone = e.phone || next.phone;
            if (e.cls) {
              const match = programs.find((p) => p.toLowerCase() === e.cls.toLowerCase());
              next.programs = match ? [match] : e.cls ? ["Other"] : [];
              if (!match && e.cls) next.programOther = e.cls;
            }
          } catch {
            /* ignore enquiry prefill failure */
          }
        }

        if (!cancelled) {
          setF(next);
          setSchoolTitle(config.instituteTitle || user?.school?.name || "A+ INSTITUTE IT & LAW");
        }
      } catch (err) {
        if (!cancelled) setError(describeApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, enquiryId, user?.id]);

  const toggleProgram = (label: string) => {
    setF((prev) => {
      const has = prev.programs.includes(label);
      return {
        ...prev,
        programs: has ? prev.programs.filter((p) => p !== label) : [...prev.programs, label],
      };
    });
  };

  const toggleDoc = (label: string) => {
    setF((prev) => {
      const has = prev.documentsChecklist.includes(label);
      return {
        ...prev,
        documentsChecklist: has
          ? prev.documentsChecklist.filter((d) => d !== label)
          : [...prev.documentsChecklist, label],
      };
    });
  };

  const updateQual = (index: number, patch: Partial<AplQualificationRow>) => {
    setF((prev) => {
      const qualifications = prev.qualifications.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (patch.totalMarks !== undefined || patch.obtainedMarks !== undefined) {
          next.percentage = calcPercentage(next.totalMarks, next.obtainedMarks);
        }
        return next;
      });
      return { ...prev, qualifications };
    });
  };

  const uploadPhoto = async (file?: File | null) => {
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const res = await uploadsApi.upload(file, { purpose: "student-photo", folder: "students/photos" });
      set({ photo: res.upload.url });
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!f.name.trim()) {
      alert("Please enter Student Name.");
      return;
    }
    if (!primaryProgram) {
      alert("Please select at least one program / course.");
      return;
    }
    if (requireLat && f.programs.includes("LLB")) {
      const lat = f.qualifications.find((q) => q.level.startsWith("LAT"));
      if (!lat?.obtainedMarks && !f.documentsChecklist.some((d) => d.toLowerCase().includes("lat"))) {
        alert("LLB applicants should fill LAT marks or tick LAT Result in documents.");
        return;
      }
    }

    const selectedNursing = NURSING_TRACKS.find((track) => track.courseName === f.course) || initialTrack;
    const extras: StudentAdmissionExtras = {
      category,
      nursingProgram: category === "nursing" ? f.course || undefined : undefined,
      nursingDuration: category === "nursing" ? selectedNursing?.duration : undefined,
      nursingNote: f.nursingNote.trim() || undefined,
      formNo: f.formNo.trim() || undefined,
      cnic: f.cnic.trim() || undefined,
      guardianCnic: f.guardianCnic.trim() || undefined,
      altPhone: f.altPhone.trim() || undefined,
      programOther: f.programOther.trim() || undefined,
      documentOther: f.documentOther.trim() || undefined,
      programs: category === "general" ? f.programs : f.course ? [f.course] : f.programs,
      qualifications: f.qualifications,
      documentsChecklist: f.documentsChecklist,
      fees: f.fees,
    };

    const payload: CreateStudentInput = {
      name: f.name.trim(),
      studentId: f.studentId.trim() || undefined,
      admissionNo: f.formNo.trim() || undefined,
      admissionDate: f.admissionDate || undefined,
      photo: f.photo || undefined,
      dob: f.dob || undefined,
      email: f.email.trim() || undefined,
      phone: f.phone.trim() || undefined,
      address: f.address.trim() || undefined,
      father: f.father.trim() || undefined,
      guardian: f.father.trim() || undefined,
      cls: primaryProgram,
      course: f.course || primaryProgram || undefined,
      courseId: f.courseId || undefined,
      section: f.section || "A",
      session: f.session || "2025-2026",
      status: f.status || "Active",
      admissionExtras: extras,
      branchId: currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined,
      notes: [
        `Category: ${preset.title}`,
        f.course ? `Course: ${f.course}` : "",
        f.nursingNote ? `Nursing note: ${f.nursingNote}` : "",
        f.programs.length ? `Programs: ${f.programs.join(", ")}` : "",
        f.programOther ? `Other program: ${f.programOther}` : "",
        f.fees.remarks ? `Fee remarks: ${f.fees.remarks}` : "",
      ]
        .filter(Boolean)
        .join(" | ") || undefined,
    };

    if (!isEdit && f.password.trim()) payload.password = f.password.trim();

    try {
      setSubmitting(true);
      setError(null);
      if (isEdit && studentId) {
        await studentsApi.update(studentId, payload);
      } else {
        await studentsApi.create(payload);
        if (enquiryId) {
          try {
            await admissionsApi.update(enquiryId, { stage: "Admitted" });
          } catch {
            /* non-blocking */
          }
        }
      }
      router.push("/students");
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--theme-text-muted)]">
        Loading admission form…
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-[960px] space-y-4 pb-10">
      <PageHeader
        title={preset.formTitle}
        subtitle={`${schoolTitle} — ${preset.title}`}
        back={
          <Link
            href={isEdit ? "/students" : "/students/new"}
            className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        }
        actions={
          <Btn variant="primary" Icon={Save} loading={submitting} onClick={() => handleSubmit()}>
            {isEdit ? "Update Admission" : "Save Admission"}
          </Btn>
        }
      />

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="min-w-[960px] rounded-md border-2 border-[#1e4b8f] bg-white shadow-sm print:min-w-0 print:border print:shadow-none"
      >
        {/* Header bar */}
        <div className="flex items-stretch border-b-2 border-[#1e4b8f]">
          <div className="flex flex-1 flex-col justify-center bg-[#1e4b8f] px-4 py-3 text-white sm:px-6">
            <div className="text-lg font-bold tracking-wide sm:text-xl">{schoolTitle}</div>
            <div className="text-xs uppercase tracking-[0.2em] text-blue-100">{preset.formTitle}</div>
          </div>
          <div className="hidden w-40 flex-col justify-center gap-1 border-l-2 border-[#1e4b8f] bg-slate-50 px-3 py-2 text-[12px] sm:flex">
            <div>
              <span className="font-semibold text-slate-600">Form No.</span>
              <input className={`${inputClass} text-[12px]`} value={f.formNo} onChange={(e) => set({ formNo: e.target.value })} placeholder="Auto if blank" />
            </div>
            <div>
              <span className="font-semibold text-slate-600">Date</span>
              <input type="date" className={`${inputClass} text-[12px]`} value={f.admissionDate} onChange={(e) => set({ admissionDate: e.target.value })} />
            </div>
            <div>
              <span className="font-semibold text-slate-600">Student ID</span>
              <input className={`${inputClass} text-[12px]`} value={f.studentId} onChange={(e) => set({ studentId: e.target.value })} placeholder="Auto if blank" />
            </div>
          </div>
          <div className="relative flex w-24 shrink-0 items-center justify-center border-l-2 border-[#1e4b8f] bg-white sm:w-28">
            {f.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.photo} alt="Student" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 p-2 text-center text-[10px] font-semibold uppercase text-slate-500">
                <ImagePlus className="h-5 w-5" />
                Photo
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={uploadingPhoto}
              onChange={(e) => uploadPhoto(e.target.files?.[0])}
              title="Upload photo"
            />
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {/* Mobile meta fields */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            <LineField label="Form No.">
              <input className={inputClass} value={f.formNo} onChange={(e) => set({ formNo: e.target.value })} />
            </LineField>
            <LineField label="Admission Date">
              <input type="date" className={inputClass} value={f.admissionDate} onChange={(e) => set({ admissionDate: e.target.value })} />
            </LineField>
            <LineField label="Student ID">
              <input className={inputClass} value={f.studentId} onChange={(e) => set({ studentId: e.target.value })} />
            </LineField>
          </div>

          {/* Personal info */}
          <section className="space-y-3">
            <h3 className="border-b border-[#1e4b8f]/pb-1 text-[13px] font-bold uppercase tracking-wide text-[#1e4b8f]">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <LineField label="Student Name">
                <input className={inputClass} value={f.name} onChange={(e) => set({ name: e.target.value })} required />
              </LineField>
              <LineField label="Father / Guardian Name">
                <input className={inputClass} value={f.father} onChange={(e) => set({ father: e.target.value })} />
              </LineField>
              <LineField label="CNIC / B-Form">
                <input className={inputClass} value={f.cnic} onChange={(e) => set({ cnic: e.target.value })} placeholder="xxxxx-xxxxxxx-x" />
              </LineField>
              <LineField label="Father / Guardian CNIC">
                <input className={inputClass} value={f.guardianCnic} onChange={(e) => set({ guardianCnic: e.target.value })} placeholder="xxxxx-xxxxxxx-x" />
              </LineField>
              <LineField label="Mobile / WhatsApp">
                <input className={inputClass} value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
              </LineField>
              <LineField label="Alternate Contact">
                <input className={inputClass} value={f.altPhone} onChange={(e) => set({ altPhone: e.target.value })} />
              </LineField>
              <LineField label="E-mail Address">
                <input type="email" className={inputClass} value={f.email} onChange={(e) => set({ email: e.target.value })} />
              </LineField>
              <LineField label="Date of Birth">
                <input type="date" className={inputClass} value={f.dob} onChange={(e) => set({ dob: e.target.value })} />
              </LineField>
            </div>
            <LineField label="Complete Address">
              <input className={inputClass} value={f.address} onChange={(e) => set({ address: e.target.value })} />
            </LineField>
          </section>

          {category === "nursing" ? (
            <section className="space-y-3">
              <h3 className="border-b border-[#1e4b8f]/pb-1 text-[13px] font-bold uppercase tracking-wide text-[#1e4b8f]">
                Nursing form
              </h3>
              <p className="text-[12px] text-slate-500">
                Choose the nursing program so this admission is stored as the right form.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {NURSING_TRACKS.map((track) => (
                  <label
                    key={track.id}
                    className={`flex cursor-pointer flex-col gap-1 rounded border px-3 py-3 ${
                      f.course === track.courseName ? "border-[#1e4b8f] bg-blue-50" : "border-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                      <input
                        type="radio"
                        name="nursing-track"
                        className="h-4 w-4 accent-[#1e4b8f]"
                        checked={f.course === track.courseName}
                        onChange={() => {
                          const match = courses.find((course) => course.name === track.courseName);
                          set({ course: track.courseName, courseId: match?.id || "", programs: [track.courseName] });
                        }}
                      />
                      {track.title}
                    </span>
                    <span className="pl-6 text-[12px] text-slate-600">Duration: {track.duration}</span>
                    <span className="pl-6 text-[12px] text-slate-500">{track.description}</span>
                  </label>
                ))}
              </div>
              <LineField label="Note">
                <input
                  className={inputClass}
                  value={f.nursingNote}
                  onChange={(e) => set({ nursingNote: e.target.value })}
                  placeholder="Batch, shift, or previous institute"
                />
              </LineField>
            </section>
          ) : category === "it" ? (
            <section className="space-y-3">
              <h3 className="border-b border-[#1e4b8f]/pb-1 text-[13px] font-bold uppercase tracking-wide text-[#1e4b8f]">
                IT course
              </h3>
              <CoursePicker
                courses={
                  courses.some((course) => course.category === "it")
                    ? courses
                    : preset.programs.map((name) => ({
                        id: name,
                        name,
                        category: "it",
                        status: "Active",
                        duration: "",
                      }))
                }
                value={f.course}
                category="it"
                required
                label="Course"
                onChange={(course) => set({
                  course: course?.name || "",
                  courseId: courses.find((row) => row.name === course?.name)?.id || "",
                  programs: course ? [course.name] : [],
                })}
                onCreated={(course) => {
                  setCourses((prev) => [course, ...prev.filter((row) => row.id !== course.id)]);
                  set({ course: course.name, courseId: course.id, programs: [course.name] });
                }}
              />
            </section>
          ) : (
            <section className="space-y-3">
              <h3 className="border-b border-[#1e4b8f]/pb-1 text-[13px] font-bold uppercase tracking-wide text-[#1e4b8f]">
                Program / Course Applying For
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {programs.map((label) => (
                  <label key={label} className="flex items-center gap-2 text-[13px] text-slate-800">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#1e4b8f]"
                      checked={f.programs.includes(label)}
                      onChange={() => toggleProgram(label)}
                    />
                    <span>{label}</span>
                    {label === "Other" && f.programs.includes("Other") ? (
                      <input
                        className="ml-1 min-w-0 flex-1 border-b border-slate-300 bg-transparent text-[13px] outline-none"
                        value={f.programOther}
                        onChange={(e) => set({ programOther: e.target.value })}
                        placeholder="Specify"
                      />
                    ) : null}
                  </label>
                ))}
              </div>
              <CoursePicker
                courses={courses}
                value={f.course}
                category="general"
                label="Course from the school list"
                onChange={(course) => set({ course: course?.name || "", courseId: course?.id || "" })}
                onCreated={(course) => setCourses((prev) => [course, ...prev.filter((row) => row.id !== course.id)])}
              />
            </section>
          )}

          {/* Qualifications */}
          {config.showQualificationTable !== false ? (
            <section className="space-y-3">
              <h3 className="border-b border-[#1e4b8f]/pb-1 text-[13px] font-bold uppercase tracking-wide text-[#1e4b8f]">
                Educational Qualification
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#1e4b8f] text-left text-white">
                      <th className="border border-[#1e4b8f] px-2 py-1.5 font-semibold">Qualification</th>
                      <th className="border border-[#1e4b8f] px-2 py-1.5 font-semibold">Board / University</th>
                      <th className="border border-[#1e4b8f] px-2 py-1.5 font-semibold">Year</th>
                      <th className="border border-[#1e4b8f] px-2 py-1.5 font-semibold">Total Marks</th>
                      <th className="border border-[#1e4b8f] px-2 py-1.5 font-semibold">Obtained</th>
                      <th className="border border-[#1e4b8f] px-2 py-1.5 font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.qualifications.map((row, index) => (
                      <tr key={row.level} className="bg-white">
                        <td className="border border-slate-300 px-2 py-1 font-medium text-slate-700">{row.level}</td>
                        <td className="border border-slate-300 px-1 py-0.5">
                          <input className={inputClass} value={row.board} onChange={(e) => updateQual(index, { board: e.target.value })} />
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5">
                          <input className={inputClass} value={row.year} onChange={(e) => updateQual(index, { year: e.target.value })} />
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5">
                          <input className={inputClass} value={row.totalMarks} onChange={(e) => updateQual(index, { totalMarks: e.target.value })} />
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5">
                          <input className={inputClass} value={row.obtainedMarks} onChange={(e) => updateQual(index, { obtainedMarks: e.target.value })} />
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5">
                          <input className={inputClass} value={row.percentage} onChange={(e) => updateQual(index, { percentage: e.target.value })} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {/* Fees */}
          {config.showFeeDetails !== false ? (
            <section className="space-y-3">
              <h3 className="border-b border-[#1e4b8f]/pb-1 text-[13px] font-bold uppercase tracking-wide text-[#1e4b8f]">
                Fee Details
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <LineField label="Admission / Registration Fee">
                  <input className={inputClass} value={f.fees.admissionFee} onChange={(e) => set({ fees: { ...f.fees, admissionFee: e.target.value } })} />
                </LineField>
                <LineField label="Semester / Course Fee">
                  <input className={inputClass} value={f.fees.courseFee} onChange={(e) => set({ fees: { ...f.fees, courseFee: e.target.value } })} />
                </LineField>
                <LineField label="Monthly Fee (if applicable)">
                  <input className={inputClass} value={f.fees.monthlyFee} onChange={(e) => set({ fees: { ...f.fees, monthlyFee: e.target.value } })} />
                </LineField>
                <LineField label="Discount / Scholarship">
                  <input className={inputClass} value={f.fees.discount} onChange={(e) => set({ fees: { ...f.fees, discount: e.target.value } })} />
                </LineField>
                <LineField label="Receipt No.">
                  <input className={inputClass} value={f.fees.receiptNo} onChange={(e) => set({ fees: { ...f.fees, receiptNo: e.target.value } })} />
                </LineField>
                <LineField label="Payment Date">
                  <input type="date" className={inputClass} value={f.fees.paymentDate} onChange={(e) => set({ fees: { ...f.fees, paymentDate: e.target.value } })} />
                </LineField>
              </div>
              <LineField label="Fee Schedule / Remarks">
                <input className={inputClass} value={f.fees.remarks} onChange={(e) => set({ fees: { ...f.fees, remarks: e.target.value } })} />
              </LineField>
            </section>
          ) : null}

          {/* Documents */}
          <section className="space-y-3">
            <h3 className="border-b border-[#1e4b8f]/pb-1 text-[13px] font-bold uppercase tracking-wide text-[#1e4b8f]">
              Documents Attached
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {checklist.map((label) => (
                <label key={label} className="flex items-center gap-2 text-[13px] text-slate-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#1e4b8f]"
                    checked={f.documentsChecklist.includes(label)}
                    onChange={() => toggleDoc(label)}
                  />
                  <span>{label}</span>
                  {label === "Other" && f.documentsChecklist.includes("Other") ? (
                    <input
                      className="ml-1 min-w-0 flex-1 border-b border-slate-300 bg-transparent text-[13px] outline-none"
                      value={f.documentOther}
                      onChange={(e) => set({ documentOther: e.target.value })}
                      placeholder="Specify"
                    />
                  ) : null}
                </label>
              ))}
            </div>
          </section>

          {!isEdit ? (
            <section className="space-y-3">
              <h3 className="border-b border-[#1e4b8f]/pb-1 text-[13px] font-bold uppercase tracking-wide text-[#1e4b8f]">
                Portal Login (optional)
              </h3>
              <p className="text-[12px] text-slate-500">
                If email is set, a student login is created. Leave password blank to use the default.
              </p>
              <LineField label="Password">
                <input type="password" className={inputClass} value={f.password} onChange={(e) => set({ password: e.target.value })} placeholder="Optional" />
              </LineField>
            </section>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Link
              href="/students"
              className="inline-flex h-9 items-center rounded border border-slate-300 px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <Btn type="submit" variant="primary" Icon={Save} loading={submitting}>
              {isEdit ? "Update Admission" : "Save Admission"}
            </Btn>
          </div>
        </div>
      </form>
    </div>
  );
}
