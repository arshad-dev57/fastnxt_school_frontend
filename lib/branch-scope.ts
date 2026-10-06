/* Frontend adapter for branch-aware mock records.
   Replace `branchIdForMockRecord` with the record.branchId returned by the API. */
import type { Branch } from "@/lib/branch";

const activeBranchIds = ["BR-MAIN", "BR-GUL", "BR-NORTH", "BR-DHA"] as const;

export function branchIdForMockRecord(id: string) {
  const value = id.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return activeBranchIds[value % activeBranchIds.length];
}

export function isInBranchScope(recordId: string, branchId: string | "all") {
  return branchId === "all" || branchIdForMockRecord(recordId) === branchId;
}

export function branchNameForRecord(recordId: string, branches: Branch[]) {
  return branches.find((branch) => branch.id === branchIdForMockRecord(recordId))?.name ?? "Unknown campus";
}

/* ---------------------------------------------------------------------------
   Preferred path for NEW records: they carry a real `branchId` field, so the
   scope filter is a straight match instead of the legacy hash adapter above.
   ------------------------------------------------------------------------- */

export type BranchScoped = { branchId: string };

/** Filter branch-aware rows for the active scope ("all" = consolidated). */
export function scopeRows<T extends BranchScoped>(rows: T[], branchId: string | "all"): T[] {
  return branchId === "all" ? rows : rows.filter((r) => r.branchId === branchId);
}

/** Group rows by branch id (used by consolidated reports). */
export function groupByBranch<T extends BranchScoped>(rows: T[]): Record<string, T[]> {
  return rows.reduce<Record<string, T[]>>((acc, r) => {
    (acc[r.branchId] ??= []).push(r);
    return acc;
  }, {});
}
