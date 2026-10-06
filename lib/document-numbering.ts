/* ============================================================================
   BisonsEduCore360 — Branch-specific document numbering
   ---------------------------------------------------------------------------
   Every branch owns its own document sequence (MAIN-STU-0001, GUL-STU-0001 …)
   so two campuses can never collide on a number. This is intentionally a
   frontend-only in-memory counter today; swap the counter for an API call later.
   ========================================================================== */

import { BRANCH_NUMBERING, getBranchById } from "@/lib/branch-mock-data";

export type NumberingModule = "students" | "fees" | "expenses" | "admissions";

export const NUMBERING_MODULES: { key: NumberingModule; label: string; example: string }[] = [
  { key: "students", label: "Student admission number", example: "MAIN-STU-0001" },
  { key: "admissions", label: "Admission application", example: "MAIN-ADM-0001" },
  { key: "fees", label: "Fee voucher / receipt", example: "MAIN-FEE-0001" },
  { key: "expenses", label: "Expense voucher", example: "MAIN-EXP-0001" },
];

export function prefixFor(branchId: string, module: NumberingModule): string {
  return BRANCH_NUMBERING[branchId]?.[module] ?? getBranchById(branchId)?.code?.concat("-", module.slice(0, 3).toUpperCase()) ?? "GEN";
}

export function formatDocumentNumber(branchId: string, module: NumberingModule, sequence: number, pad = 4): string {
  return `${prefixFor(branchId, module)}-${String(sequence).padStart(pad, "0")}`;
}

/* Session-scoped counters, seeded per branch + module (mock only). */
const counters = new Map<string, number>();
const keyOf = (branchId: string, module: NumberingModule) => `${branchId}:${module}`;

export function nextDocumentNumber(branchId: string, module: NumberingModule): string {
  const key = keyOf(branchId, module);
  const next = (counters.get(key) ?? 0) + 1;
  counters.set(key, next);
  return formatDocumentNumber(branchId, module, next);
}

/** Peek at the next few numbers without consuming them. */
export function previewSequence(branchId: string, module: NumberingModule, count = 3): string[] {
  const start = counters.get(keyOf(branchId, module)) ?? 0;
  return Array.from({ length: count }, (_, i) => formatDocumentNumber(branchId, module, start + i + 1));
}
