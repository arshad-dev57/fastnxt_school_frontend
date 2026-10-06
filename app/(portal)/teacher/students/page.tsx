"use client";

import { Download, IdCard, Phone, User } from "lucide-react";
import { Btn, PageHeader, Select, StatCard } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { PORTAL_TEACHER, teacherClassSectionLabels, teacherClasses, teacherStudents } from "@/lib/portal-data";
import { useState } from "react";

/* Teacher Students = the Admin /students module filtered to the teacher's own
   sections. A Teacher can view (and export) student records but cannot create,
   delete or promote — those actions stay in the Admin, matching the role's
   view/create/edit scope in branch-access.ts (no students module granted). */
export default function TeacherStudentsPage() {
  const [section, setSection] = useState("");

  const rows = section
    ? teacherStudents.filter((s) => `${s.cls}-${s.section}` === section)
    : teacherStudents;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="My Students"
        subtitle={`Students in your own sections · ${PORTAL_TEACHER.name}`}
        actions={<Btn variant="secondary" Icon={Download}>Export List</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard label="Total Students" value={teacherStudents.length} Icon={User} tone="blue" sub="In your sections" />
        <StatCard label="Sections" value={teacherClasses.length} Icon={User} tone="purple" sub="You teach" />
        <StatCard label="Male" value={teacherStudents.filter((s) => s.gender === "Male").length} Icon={User} tone="green" />
        <StatCard label="Female" value={teacherStudents.filter((s) => s.gender === "Female").length} Icon={User} tone="orange" />
      </div>

      <div className="px-4 pt-4 sm:px-6">
        <label className="inline-flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
          Section
          <Select options={teacherClassSectionLabels} value={section} onChange={(e) => setSection(e.target.value)} placeholder="All sections" className="w-48" />
        </label>
      </div>

      <div className="mt-1">
        <PortalBoard
          title="Student Directory"
          subtitle="Read-only view of students in your sections."
          Icon={User}
          nameLabel="Student"
          rows={rows}
          keyOf={(r) => r.id}
          nameOf={(r) => r.name}
          subtitleOf={(r) => `${r.cls}-${r.section} · ${r.id}`}
          searchTextOf={(r) => `${r.name} ${r.id} ${r.cls} ${r.section} ${r.guardian} ${r.contact}`}
          searchPlaceholder="Search name, ID or guardian"
          scopeLabel={section || "All my sections"}
          countNoun="students"
          groupBy={(r) => `${r.cls}-${r.section}`}
          groupColorOf={() => "var(--theme-primary)"}
          columns={[
            { key: "id", label: "Student ID", width: "120px", cell: (r) => r.id },
            { key: "cls", label: "Class", width: "120px", cell: (r) => `${r.cls}-${r.section}` },
            { key: "gender", label: "Gender", width: "100px", cell: (r) => r.gender },
            { key: "guardian", label: "Guardian", width: "minmax(150px,1fr)", cell: (r) => r.guardian },
            { key: "contact", label: "Phone", width: "150px", cell: (r) => (
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-faint)]" />{r.contact}</span>
            ) },
            { key: "admission", label: "Admission Date", width: "140px", cell: (r) => r.admissionDate },
          ]}
          detailFields={(r) => [
            { label: "Student ID", value: r.id },
            { label: "Name", value: r.name },
            { label: "Class", value: `${r.cls}-${r.section}` },
            { label: "Gender", value: r.gender },
            { label: "Guardian", value: r.guardian },
            { label: "Phone", value: r.contact },
            { label: "Admission Date", value: r.admissionDate },
            { label: "Status", value: r.status },
          ]}
          menu={() => [{ label: "View ID card", Icon: IdCard, onClick: () => {} }]}
          emptyTitle="No students"
          emptyMessage="No students match the selected section."
          minWidth={900}
        />
      </div>
    </div>
  );
}
