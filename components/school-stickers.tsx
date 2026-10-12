"use client";

import { cn } from "@/components/ui";

/** Cartoon PNGs still used by header chrome (bell / theme / search). */
export const SCHOOL_HEADER_IMAGES = {
  graduation: "/images/education/graduation.png",
  training: "/images/education/training.png",
  schoolBell: "/images/education/school-bell.png",
  artBrush: "/images/education/art-brush.png",
  magnifyingGlass: "/images/education/magnifying-glass.png",
} as const;

/** School / student / books stickers for dashboard surfaces. */
export const SCHOOL_DASHBOARD_ICONS = {
  books: "/stickers/books.svg",
  backpack: "/stickers/backpack.svg",
  graduationCap: "/stickers/graduation-cap.svg",
  bookApple: "/stickers/book-apple.svg",
  pencil: "/stickers/pencil.svg",
  students: "/images/education/students.svg",
  campus: "/images/education/campus.svg",
  classes: "/images/education/classes.svg",
} as const;

export type SchoolHeaderImageKey = keyof typeof SCHOOL_HEADER_IMAGES;

function StickerImg({
  src,
  alt = "",
  size = 28,
  className,
}: {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={cn("pointer-events-none select-none object-contain drop-shadow-sm", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Soft welcome strip with school / books / students stickers. */
export function DashboardWelcomeBanner({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--theme-border)] bg-gradient-to-br from-[var(--theme-primary-soft)] via-[var(--theme-surface)] to-[var(--theme-accent-soft)] px-4 py-5 sm:px-6 sm:py-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      >
        <StickerImg src={SCHOOL_DASHBOARD_ICONS.books} size={42} className="absolute right-4 top-2 opacity-90 sm:right-8" />
        <StickerImg src={SCHOOL_DASHBOARD_ICONS.backpack} size={30} className="absolute right-16 bottom-3 opacity-85 max-sm:hidden sm:right-24" />
        <StickerImg src={SCHOOL_DASHBOARD_ICONS.graduationCap} size={32} className="absolute bottom-2 right-36 opacity-80 max-md:hidden" />
      </div>
      <div className="relative z-[1] flex flex-wrap items-end gap-3 pr-16 sm:pr-28">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <StickerImg src={SCHOOL_DASHBOARD_ICONS.students} size={30} />
            <StickerImg src={SCHOOL_DASHBOARD_ICONS.bookApple} size={26} className="max-sm:hidden" />
            <StickerImg src={SCHOOL_DASHBOARD_ICONS.pencil} size={24} className="max-sm:hidden" />
            <StickerImg src={SCHOOL_DASHBOARD_ICONS.campus} size={28} className="max-md:hidden" />
          </div>
          <h2 className="text-[18px] font-bold leading-snug text-[var(--theme-text)] sm:text-[20px]">{title}</h2>
          {subtitle ? (
            <p className="mt-1 max-w-xl text-[13px] text-[var(--theme-text-muted)] sm:text-[14px]">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
