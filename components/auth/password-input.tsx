"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn, Input, type IconType } from "@/components/ui";

/* Password field with an optional leading icon and an accessible show/hide
   toggle. Used by both the login and the school-registration forms. */

export default function PasswordInput({ className = "", icon: Icon, ...props }: InputHTMLAttributes<HTMLInputElement> & { icon?: IconType }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      {Icon && (
        <Icon
          aria-hidden="true"
          strokeWidth={1.8}
          className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--theme-text-faint)]"
        />
      )}
      <Input {...props} type={show ? "text" : "password"} className={cn(Icon && "pl-10", "pr-11", className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-[var(--theme-text-muted)] transition-colors hover:bg-[var(--theme-hover)] hover:text-[var(--theme-text)]"
      >
        {show ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.8} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.8} />}
      </button>
    </div>
  );
}

