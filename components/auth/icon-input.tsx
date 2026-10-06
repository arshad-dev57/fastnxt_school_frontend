"use client";

import type { InputHTMLAttributes } from "react";
import { cn, Input, type IconType } from "@/components/ui";

/* Text input with a leading icon — the pattern used across the auth forms.
   Keeps the icon, padding and focus ring consistent in one place. */

export default function IconInput({ icon: Icon, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { icon: IconType }) {
  return (
    <div className="relative">
      <Icon
        aria-hidden="true"
        strokeWidth={1.8}
        className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--theme-text-faint)]"
      />
      <Input {...props} className={cn("pl-10", className)} />
    </div>
  );
}
