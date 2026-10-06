"use client";

/* ============================================================================
   BisonsEduCore360 — Branch Context / Provider
   Centralized branch state management for multi-campus support
   ========================================================================== */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { BRANCHES, demoAccessForRole } from "@/lib/branch-mock-data";
import { type Branch, type UserBranchAccess, type UserRole, type Permission, type PermissionAction } from "@/lib/branch";
import { getRolePermissions, roleHasPermission, type AccessModule } from "@/lib/branch-access";
import { nextDocumentNumber, type NumberingModule } from "@/lib/document-numbering";
import { useAuth } from "@/lib/auth/auth-context";
import { branchApi, describeApiError, type Branch as ApiBranch } from "@/lib/auth/api-client";

type BranchMode = "single" | "all";

interface BranchContextValue {
  currentBranchId: string | "all";
  currentBranch: Branch | null;
  availableBranches: Branch[];
  userBranches: Branch[];
  branchMode: BranchMode;
  userRole: UserRole;
  userBranchAccess: UserBranchAccess | null;
  /** Effective permission list for the active (possibly previewed) role. */
  permissions: Permission[];
  /** Human label for the active data scope, e.g. "All Branches" / "Main Campus". */
  activeScopeLabel: string;
  setCurrentBranch: (branchId: string | "all") => void;
  setBranchMode: (mode: BranchMode) => void;
  getAvailableBranches: () => Branch[];
  getCurrentBranch: () => Branch | null;
  canAccessBranch: (branchId: string) => boolean;
  /** True when the active role may perform `action` (default "view") on a module. */
  can: (module: AccessModule, action?: PermissionAction) => boolean;
  /** Branch-prefixed document number, e.g. MAIN-STU-0001. */
  documentNumber: (module: NumberingModule) => string;
  branchNameFor: (branchId: string) => string;
  isAllBranchesMode: () => boolean;
  isBranchAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  /** Preview another role's branch/permission scope (demo only). */
  roleOverride: UserRole | null;
  simulateRole: (role: UserRole | null) => void;
  loading: boolean;
}

const BranchContext = createContext<BranchContextValue | null>(null);

interface BranchProviderProps {
  children: ReactNode;
  userRole?: UserRole;
  userBranchAccess?: UserBranchAccess | null;
}

// Convert API branch to frontend Branch type
function apiBranchToBranch(apiBranch: ApiBranch): Branch {
  return {
    id: apiBranch.id,
    name: apiBranch.name,
    code: apiBranch.code,
    address: apiBranch.address || "",
    city: apiBranch.city || "",
    phone: apiBranch.phone || "",
    email: "",
    principal: "",
    timezone: "Asia/Karachi",
    currency: "PKR",
    academicCalendar: "2025-2026",
    openingDate: "",
    status: apiBranch.status === "ACTIVE" ? "Active" : "Inactive",
    description: "",
    createdAt: apiBranch.createdAt,
    updatedAt: apiBranch.updatedAt,
  };
}

export function BranchProvider({ children, userRole = "Super Admin", userBranchAccess = null }: BranchProviderProps) {
  const { signedIn, ready } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string | "all">(() => {
    if (typeof window === "undefined") return "all";
    return window.localStorage.getItem("bisons:active-branch") || "all";
  });
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real branches from API when signed in
  useEffect(() => {
    if (!ready || !signedIn) {
      setLoading(false);
      return;
    }

    branchApi.list()
      .then((res) => {
        const converted = res.branches.map(apiBranchToBranch);
        setBranches(converted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load branches:", describeApiError(err).message);
        // Fall back to mock data if API fails
        setBranches(BRANCHES.filter((b) => b.status === "Active"));
        setLoading(false);
      });
  }, [ready, signedIn]);

  // Use real branches if available, otherwise mock data
  const availableBranches = useMemo(() => {
    if (branches.length > 0) {
      return branches.filter((b) => b.status === "Active");
    }
    return BRANCHES.filter((b) => b.status === "Active");
  }, [branches]);

  // "View as role" preview keeps the UI honest about branch + permission scope.
  const effectiveRole: UserRole = roleOverride ?? userRole;
  const effectiveAccess = roleOverride ? demoAccessForRole(roleOverride) : userBranchAccess;
  const isSuperScope = effectiveRole === "Super Admin" || effectiveRole === "Owner";

  const userBranches = useMemo(() => {
    if (!effectiveAccess || isSuperScope) {
      return availableBranches;
    }
    return availableBranches.filter((b) => effectiveAccess.branchIds.includes(b.id));
  }, [availableBranches, isSuperScope, effectiveAccess]);

  const canAccessBranch = useCallback(
    (branchId: string) => {
      if (isSuperScope) return true;
      if (!effectiveAccess) return false;
      return effectiveAccess.branchIds.includes(branchId);
    },
    [isSuperScope, effectiveAccess]
  );

  // Derive the effective scope (no effect needed): a previewed role automatically
  // falls back to a campus it is actually allowed to see.
  const currentBranchId: string | "all" = useMemo(() => {
    if (isSuperScope) return selectedBranchId;
    const allowed = effectiveAccess?.branchIds ?? [];
    if (selectedBranchId !== "all" && allowed.includes(selectedBranchId)) return selectedBranchId;
    return allowed[0] ?? "all";
  }, [selectedBranchId, isSuperScope, effectiveAccess]);

  const branchMode: BranchMode = currentBranchId === "all" ? "all" : "single";

  const currentBranch = useMemo(() => {
    if (currentBranchId === "all") return null;
    return availableBranches.find((b) => b.id === currentBranchId) ?? null;
  }, [currentBranchId, availableBranches]);

  const isAllBranchesMode = useCallback(() => currentBranchId === "all", [currentBranchId]);

  const isBranchAdmin = useCallback(
    () => effectiveRole === "Branch Admin" || effectiveRole === "Principal",
    [effectiveRole]
  );

  const isSuperAdmin = useCallback(() => effectiveRole === "Super Admin" || effectiveRole === "Owner", [effectiveRole]);

  const permissions = useMemo(() => getRolePermissions(effectiveRole), [effectiveRole]);
  const can = useCallback(
    (module: AccessModule, action: PermissionAction = "view") => roleHasPermission(effectiveRole, module, action),
    [effectiveRole]
  );

  const branchNameFor = useCallback(
    (branchId: string) => availableBranches.find((b) => b.id === branchId)?.name ?? "—",
    [availableBranches]
  );

  const documentNumber = useCallback(
    (module: NumberingModule) => {
      const target = currentBranchId === "all" ? userBranches[0]?.id ?? availableBranches[0]?.id ?? "BR-MAIN" : currentBranchId;
      return nextDocumentNumber(target, module);
    },
    [currentBranchId, userBranches, availableBranches]
  );

  const activeScopeLabel = currentBranch ? `${currentBranch.name} (${currentBranch.code})` : "All Branches";

  const getAvailableBranches = useCallback(() => availableBranches, [availableBranches]);
  const getCurrentBranch = useCallback(() => currentBranch, [currentBranch]);

  const handleSetCurrentBranch = useCallback((branchId: string | "all") => {
    if (branchId === "all" || canAccessBranch(branchId)) {
      setSelectedBranchId(branchId);
    }
  }, [canAccessBranch]);

  // The selector is global, so retain its choice across route changes and reloads.
  // Server-side authorization must enforce this same scope once an API is added.
  useEffect(() => {
    window.localStorage.setItem("bisons:active-branch", currentBranchId);
  }, [currentBranchId]);

  const handleSetBranchMode = useCallback((mode: BranchMode) => {
    if (mode === "all") setSelectedBranchId("all");
  }, []);

  const simulateRole = useCallback((role: UserRole | null) => setRoleOverride(role), []);

  const value = useMemo(
    () => ({
      currentBranchId,
      currentBranch,
      availableBranches,
      userBranches,
      branchMode,
      userRole: effectiveRole,
      userBranchAccess: effectiveAccess,
      permissions,
      activeScopeLabel,
      setCurrentBranch: handleSetCurrentBranch,
      setBranchMode: handleSetBranchMode,
      getAvailableBranches,
      getCurrentBranch,
      canAccessBranch,
      can,
      documentNumber,
      branchNameFor,
      isAllBranchesMode,
      isBranchAdmin,
      isSuperAdmin,
      roleOverride,
      simulateRole,
      loading,
    }),
    [
      currentBranchId,
      currentBranch,
      availableBranches,
      userBranches,
      branchMode,
      effectiveRole,
      effectiveAccess,
      permissions,
      activeScopeLabel,
      handleSetCurrentBranch,
      handleSetBranchMode,
      getAvailableBranches,
      getCurrentBranch,
      canAccessBranch,
      can,
      documentNumber,
      branchNameFor,
      isAllBranchesMode,
      isBranchAdmin,
      isSuperAdmin,
      roleOverride,
      simulateRole,
      loading,
    ]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}

export function useCurrentBranch() {
  const { currentBranch, currentBranchId } = useBranch();
  return { currentBranch, currentBranchId };
}

export function useAvailableBranches() {
  const { availableBranches, userBranches } = useBranch();
  return { availableBranches, userBranches };
}

export function useBranchPermissions() {
  const { canAccessBranch, isAllBranchesMode, isBranchAdmin, isSuperAdmin, userRole, userBranchAccess, can, permissions } = useBranch();
  return { canAccessBranch, isAllBranchesMode, isBranchAdmin, isSuperAdmin, userRole, userBranchAccess, can, permissions };
}

/** Convenience hook for module pages that only need the active scope helpers. */
export function useBranchScope() {
  const { currentBranchId, currentBranch, activeScopeLabel, branchNameFor, documentNumber } = useBranch();
  return {
    currentBranchId,
    currentBranch,
    isAllBranches: currentBranchId === "all",
    activeScopeLabel,
    branchNameFor,
    documentNumber,
  };
}
