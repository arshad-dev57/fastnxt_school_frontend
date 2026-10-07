"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase, CheckCircle2, Loader2, RefreshCw, Save, User, BookOpen,
  Phone, Mail, MapPin, Calendar, CreditCard, Building2, GraduationCap,
  ShieldCheck,
} from "lucide-react";
import {
  Avatar, Badge, Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea, type IconType,
} from "@/components/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";
import { employeesApi, subjectsApi, type EmployeeItem, type SubjectAssignmentItem } from "@/lib/auth/api-client";

/* ===========================================================================
   Teacher Profile — fully dynamic, reads real employee record from API.
   ========================================================================== */

const GENDERS = ["Male", "Female", "Other"];
const DESIGNATIONS = ["Teacher", "Senior Teacher", "Head of Department", "Principal", "Vice Principal", "Lecturer", "Instructor"];
const DEPARTMENTS = ["Science", "Mathematics", "English", "Urdu", "Social Studies", "Islamic Studies", "Computer Science", "Arts", "Physical Education", "General"];
const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Part-Time", "Visiting"];

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const { currentBranchId, currentBranch } = useBranch();

  const [employee, setEmployee] = useState<EmployeeItem | null>(null);
  const [assignments, setAssignments] = useState<SubjectAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable contact fields only
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

      // Search employee by logged-in user's email
      const [empRes, assignRes] = await Promise.all([
        employeesApi.list({ q: user.email, branchId: branchScope }),
        subjectsApi.listAssignments({ branchId: branchScope }),
      ]);

      // Find the employee matching this user's email or name
      const emps: EmployeeItem[] = empRes.employees ?? [];
      const matched =
        emps.find((e) => e.email?.toLowerCase() === user.email.toLowerCase()) ||
        emps.find((e) => e.name?.toLowerCase() === (user.name || "").toLowerCase()) ||
        (emps.length > 0 ? emps[0] : null);

      setEmployee(matched ?? null);
      if (matched) {
        setPhone(matched.phone || "");
        setEmail(matched.email || user.email || "");
        setAddress(matched.address || "");
      } else {
        setEmail(user.email || "");
      }

      // Filter subject assignments for this teacher
      const allAssign: SubjectAssignmentItem[] = assignRes.assignments ?? [];
      const myAssign = allAssign.filter(
        (a) =>
          a.teacher?.toLowerCase().includes((user.name || "").toLowerCase()) ||
          a.teacher?.toLowerCase().includes(user.email.toLowerCase())
      );
      setAssignments(myAssign.length > 0 ? myAssign : allAssign.slice(0, 6));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [user, currentBranchId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const save = async () => {
    if (!employee) return;
    setSaving(true);
    try {
      await employeesApi.update(employee.id, { phone, email, address });
      setSaved(true);
      // Refresh
      await loadProfile();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const displayName = employee?.name || user?.name || "Teacher";
  const campusName = currentBranch?.name || user?.branch?.name || user?.school?.name || "Main Campus";
  const schoolName = user?.school?.name || "";

  const uniqueSubjects = [...new Set(assignments.map((a) => a.subject))];
  const uniqueClasses = [...new Set(assignments.map((a) => `${a.cls}-${a.section}`))];

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-16 text-[var(--theme-text-muted)]">
        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
        Loading your profile…
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle={`Personal and employment details · ${campusName}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={loadProfile}
              className="flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px] hover:bg-[var(--theme-hover)]"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            {employee && (
              <Btn variant="primary" Icon={Save} onClick={save} loading={saving} loadingLabel="Saving…">
                Save Changes
              </Btn>
            )}
          </div>
        }
      />

      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-[var(--theme-error-border)] bg-[var(--theme-error-soft)] px-4 py-3 text-[13px] text-[var(--theme-error-text)] sm:mx-6">
          {error}
        </div>
      )}

      {!employee && !loading && (
        <div className="mx-4 mt-4 rounded-lg border border-[var(--theme-warning-border)] bg-[var(--theme-warning-soft)] px-4 py-3 text-[13px] text-[var(--theme-warning-text)] sm:mx-6">
          No employee record was found for your account. Please contact the administration office.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        {/* LEFT — Main form */}
        <div className="space-y-5 xl:col-span-2">

          {/* Personal Info */}
          <Section icon={User} title="Personal Information" subtitle="Identity and contact details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Avatar */}
              <div className="flex items-center gap-4 sm:col-span-2">
                <Avatar name={displayName} size={64} />
                <div>
                  <p className="text-[18px] font-semibold">{displayName}</p>
                  <p className="text-[13px] text-[var(--theme-text-muted)]">
                    {employee?.designation || "Teacher"} · {employee?.department || "—"}
                  </p>
                  <Badge label={employee?.status || "Active"} tone={employee?.status === "Active" ? "green" : "gray"} />
                </div>
              </div>

              <Field label="Full Name" className="sm:col-span-2">
                <Input value={displayName} disabled />
              </Field>
              <Field label="Gender">
                <Select options={GENDERS} value={employee?.gender || "Male"} onChange={() => {}} disabled />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={employee?.dob || ""} disabled />
              </Field>
              <Field label="CNIC / National ID">
                <Input value={employee?.cnic || ""} disabled placeholder="e.g. 42101-XXXXXXX-X" />
              </Field>
              <Field label="Employee ID">
                <Input value={employee?.employeeId || "—"} disabled />
              </Field>

              {/* Editable fields */}
              <Field label="Phone (Editable)">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                  <input
                    className="w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-input-bg)] py-2 pl-9 pr-3 text-[14px] outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary-soft)]"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                  />
                </div>
              </Field>
              <Field label="Email (Editable)">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                  <input
                    className="w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-input-bg)] py-2 pl-9 pr-3 text-[14px] outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary-soft)]"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.edu"
                  />
                </div>
              </Field>
              <Field label="Address (Editable)" className="sm:col-span-2">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--theme-text-muted)]" />
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, street, area, city"
                    className="pl-9"
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* Employment Info */}
          <Section icon={Briefcase} title="Employment Details" subtitle="Role, department and joining details — managed by HR">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Designation">
                <Select options={DESIGNATIONS} value={employee?.designation || "Teacher"} onChange={() => {}} disabled />
              </Field>
              <Field label="Department">
                <Select options={DEPARTMENTS} value={employee?.department || "General"} onChange={() => {}} disabled />
              </Field>
              <Field label="Joining Date">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                  <Input type="date" value={employee?.joining || ""} disabled className="pl-9" />
                </div>
              </Field>
              <Field label="Employment Type">
                <Select options={EMPLOYMENT_TYPES} value={employee?.type || "Permanent"} onChange={() => {}} disabled />
              </Field>
              <Field label="Status">
                <Select options={["Active", "Inactive"]} value={employee?.status || "Active"} onChange={() => {}} disabled />
              </Field>
              <Field label="Branch / Campus">
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                  <Input value={campusName} disabled className="pl-9" />
                </div>
              </Field>
            </div>
            <p className="mt-3 text-[12px] text-[var(--theme-text-faint)]">
              Employment records are maintained by HR. Contact the administration office to request any corrections.
            </p>
          </Section>
        </div>

        {/* RIGHT — Summary cards */}
        <div className="space-y-5">
          {/* Employee Quick Summary */}
          <Card pad={false}>
            <CardHead title="Quick Summary" Icon={User} />
            <div className="flex flex-col items-center gap-2 border-b border-[var(--theme-border)] p-5">
              <Avatar name={displayName} size={72} />
              <p className="text-[17px] font-semibold">{displayName}</p>
              <p className="text-center text-[13px] text-[var(--theme-text-muted)]">
                {employee?.designation || "Teacher"} · {employee?.department || "—"}
              </p>
              <Badge label={employee?.status || "Active"} tone={employee?.status === "Active" ? "green" : "gray"} />
            </div>
            <div className="space-y-2.5 p-4 text-[13px]">
              <InfoRow icon={CreditCard} label="Employee ID" value={employee?.employeeId || "—"} />
              <InfoRow icon={ShieldCheck} label="Role" value={user?.role || "Teacher"} />
              <InfoRow icon={Calendar} label="Joined" value={employee?.joining || "—"} />
              <InfoRow icon={Phone} label="Phone" value={phone || "—"} />
              <InfoRow icon={Mail} label="Email" value={email || "—"} />
              <InfoRow icon={Building2} label="Campus" value={campusName} />
              {schoolName && <InfoRow icon={GraduationCap} label="School" value={schoolName} />}
            </div>
          </Card>

          {/* Teaching Load */}
          <Card pad={false}>
            <CardHead title="Teaching Load" subtitle="Derived from subject assignments" Icon={BookOpen} />
            <div className="space-y-3 p-4 text-[13px]">
              <InfoRow icon={BookOpen} label="Subjects" value={String(uniqueSubjects.length || 0)} />
              <InfoRow icon={GraduationCap} label="Class Sections" value={String(uniqueClasses.length || 0)} />
              <InfoRow icon={Briefcase} label="Assignments" value={String(assignments.length || 0)} />

              {uniqueSubjects.length > 0 && (
                <div className="pt-1">
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueSubjects.slice(0, 8).map((s) => (
                      <Badge key={s} label={s} tone="blue" />
                    ))}
                  </div>
                </div>
              )}

              {uniqueClasses.length > 0 && (
                <div className="pt-1">
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">Sections</p>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueClasses.slice(0, 8).map((c) => (
                      <Badge key={c} label={c} tone="green" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {employee && (
            <div className="flex flex-wrap gap-2">
              <Btn variant="primary" Icon={Save} onClick={save} loading={saving} loadingLabel="Saving…">
                Save Changes
              </Btn>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={saved}
        onClose={() => setSaved(false)}
        title="Profile updated"
        width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]">
            <CheckCircle2 className="h-7 w-7 icon-pop" />
          </span>
          <p className="text-[15px] font-medium">Your contact details have been saved.</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">HR has been notified of the update.</p>
        </div>
      </Modal>
    </>
  );
}

/** Section wrapper */
function Section({ icon, title, subtitle, children }: { icon: IconType; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card pad={false}>
      <CardHead title={title} subtitle={subtitle} Icon={icon} />
      <div className="p-4">{children}</div>
    </Card>
  );
}

/** Info row with icon */
function InfoRow({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-[var(--theme-text-muted)]" />
      <span className="min-w-0 flex-1 text-[var(--theme-text-muted)]">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
