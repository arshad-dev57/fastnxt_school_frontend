"use client";

import type { ReactNode } from "react";
import { cn } from "@/components/ui";

/* ============================================================================
   Educational empty-state art.

   All illustrations live in /public/images/education as hand-authored SVG
   (self-created for BisonsEduCore360 — no third-party licence or attribution
   required). They share one flat visual language: soft gradient background,
   white cards, brand blue / purple / green accents.
   ========================================================================== */

export type EduArt =
  | "meetings"
  | "students"
  | "teachers"
  | "exams"
  | "attendance"
  | "notices"
  | "classes"
  | "campus"
  | "notifications";

const ART_SRC: Record<EduArt, string> = {
  meetings: "/images/education/meetings.svg",
  students: "/images/education/students.svg",
  teachers: "/images/education/teachers.svg",
  exams: "/images/education/exams.svg",
  attendance: "/images/education/attendance.svg",
  notices: "/images/education/notices.svg",
  classes: "/images/education/classes.svg",
  campus: "/images/education/campus.svg",
  notifications: "/images/education/notifications.svg",
};

export const eduArtSrc = (art: EduArt) => ART_SRC[art];

/** Decorative illustration only — always paired with a text label. */
export function EduIllustration({ art, size = 200, className = "", float = false }: {
  art: EduArt; size?: number; className?: string; float?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ART_SRC[art]}
      alt=""
      aria-hidden="true"
      width={size}
      height={Math.round(size * 0.625)}
      loading="lazy"
      decoding="async"
      className={cn("h-auto max-w-full select-none", float && "icon-float", className)}
    />
  );
}

/** Contextual, educational empty state used across every module. */
export function EmptyArt({ art, title, message, action, size = 190, className }: {
  art: EduArt; title: string; message?: ReactNode; action?: ReactNode; size?: number; className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", className)}>
      <EduIllustration art={art} size={size} float />
      <p className="mt-1 text-[16px] font-semibold">{title}</p>
      {message && <p className="max-w-md text-[14px] leading-relaxed text-[var(--theme-text-muted)]">{message}</p>}
      {action && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
