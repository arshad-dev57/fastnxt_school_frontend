"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Save, CheckCircle2, Eye, Building2, RefreshCw } from "lucide-react";
import { Badge, Btn, Card, CardHead, Checkbox, Modal, PageHeader, Toggle, cn } from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import { type UserRole } from "@/lib/branch";
import { DEFAULT_ROLE_LIST, PERMISSION_ACTIONS, SCOPE_LABELS, getRoleDef, getRolePermissions, groupedModules } from "@/lib/branch-access";
import { rolesApi, describeApiError } from "@/lib/auth/api-client";
import { useAuth } from "@/lib/auth/auth-context";

const keyOf = (m: string, a: string) => `${m}::${a}`;
const GROUPS = groupedModules();
const MODULE_COUNT = GROUPS.reduce((n, g) => n + g.modules.length, 0);

function seed(role: UserRole): Record<string, boolean> {
  const all: Record<string, boolean> = {};
  for (const p of getRolePermissions(role)) all[keyOf(p.module, p.action)] = true;
  return all;
}

export default function RolesPermissionsPage() {
  const { simulateRole, roleOverride, userRole, applyPermissionMap } = useBranch();
  const { refresh } = useAuth();
  const [role, setRole] = useState<UserRole>(DEFAULT_ROLE_LIST[0]);
  const [perms, setPerms] = useState<Record<string, boolean>>(() => seed(DEFAULT_ROLE_LIST[0]));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load permissions for selected role from API
  const fetchRolePermissions = async (selectedRole: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.getPermissions(selectedRole);
      if (res.permissions && Object.keys(res.permissions).length > 0) {
        setPerms(res.permissions as Record<string, boolean>);
      } else {
        setPerms(seed(selectedRole));
      }
    } catch {
      // If offline or error, default to local seed
      setPerms(seed(selectedRole));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolePermissions(role);
  }, [role]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await rolesApi.savePermissions(role, perms);
      // If we just edited the signed-in role (or its preview), refresh live gating.
      if (role === userRole || roleOverride === role) {
        applyPermissionMap(perms);
      }
      await refresh().catch(() => null);
      setSaved(true);
    } catch (err) {
      const { message } = describeApiError(err);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const total = MODULE_COUNT * PERMISSION_ACTIONS.length;
  const granted = useMemo(() => Object.values(perms).filter(Boolean).length, [perms]);
  const def = getRoleDef(role);

  const toggle = (m: string, a: string) => setPerms((p) => ({ ...p, [keyOf(m, a)]: !p[keyOf(m, a)] }));
  const toggleModule = (m: string, on: boolean) =>
    setPerms((p) => {
      const next = { ...p };
      for (const a of PERMISSION_ACTIONS) next[keyOf(m, a)] = on;
      return next;
    });
  const moduleAll = (m: string) => PERMISSION_ACTIONS.every((a) => perms[keyOf(m, a)]);

  return (
    <>
      <PageHeader title="Roles & Permissions" subtitle="Role × module × action × branch scope — connected to live API."
        actions={
          <>
            <Btn variant="secondary" Icon={Eye} onClick={() => simulateRole(role)}>Preview this role</Btn>
            <Btn variant="primary" Icon={Save} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Permissions"}
            </Btn>
          </>
        } />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 lg:grid-cols-4">
        <Card pad={false} className="lg:col-span-1">
          <CardHead title="Roles" subtitle={`${DEFAULT_ROLE_LIST.length} default roles`} Icon={ShieldCheck} />
          <div className="space-y-1 p-2">
            {DEFAULT_ROLE_LIST.map((r) => {
              const d = getRoleDef(r);
              return (
                <button key={r} onClick={() => setRole(r)}
                  className={cn("flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-left text-[14px] transition-colors",
                    role === r ? "bg-[var(--theme-primary-soft)] font-medium text-[var(--theme-primary-soft-text)]" : "hover:bg-[var(--theme-hover)]")}>
                  <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{r}</span>
                    <span className="block truncate text-[11px] text-[var(--theme-text-faint)]">{d ? SCOPE_LABELS[d.scope] : ""}</span>
                  </span>
                  {role === r && <Badge label="Editing" tone="blue" />}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-3">
          {error && (
            <div className="rounded-lg bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
              {error}
            </div>
          )}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]"><Building2 className="h-5 w-5" /></span>
                <div>
                  <p className="text-[16px] font-semibold">{role}</p>
                  <p className="text-[13px] text-[var(--theme-text-muted)]">
                    {loading ? "Loading permissions..." : `${granted} of ${total} permissions · ${def ? SCOPE_LABELS[def.scope] : ""}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="secondary" Icon={RefreshCw} onClick={() => fetchRolePermissions(role)}>Reload</Btn>
                <Toggle checked onChange={() => {}} label="Role active" />
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--theme-border)]">
              <div className="h-full rounded-full bg-[var(--theme-accent)] transition-[width]" style={{ width: `${(granted / total) * 100}%` }} />
            </div>
            {def && <p className="mt-3 text-[13px] text-[var(--theme-text-muted)]">{def.description}</p>}
          </Card>

          {GROUPS.map((g) => (
            <Card key={g.group} pad={false}>
              <CardHead title={g.group} subtitle={`${g.modules.length} modules`} />
              <div className="divide-y divide-[var(--theme-border)]">
                {g.modules.map((m) => (
                  <div key={m.key} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                    <span className="min-w-[150px] flex-1 text-[14px] font-medium">{m.label}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {PERMISSION_ACTIONS.map((a) => {
                        const on = !!perms[keyOf(m.key, a)];
                        return (
                          <button key={a} type="button" onClick={() => toggle(m.key, a)}
                            className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium capitalize transition-colors",
                              on ? "bg-[var(--theme-primary)] text-white" : "bg-[var(--theme-subtle)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-border)]")}>
                            {a}
                          </button>
                        );
                      })}
                    </div>
                    <label className="ml-2 flex items-center gap-1.5 text-[12px] text-[var(--theme-text-muted)]">
                      <Checkbox checked={moduleAll(m.key)} onChange={(v) => toggleModule(m.key, v)} /> All
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={saved} onClose={() => setSaved(false)} title="Permissions saved" width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"><CheckCircle2 className="h-7 w-7 icon-pop" /></span>
          <p className="text-[15px] font-medium">Permissions for <span className="font-semibold">{role}</span> saved to server.</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">{granted} of {total} permissions are now enabled.</p>
        </div>
      </Modal>
      {roleOverride && <p className="px-4 pb-6 text-center text-[12px] text-[var(--theme-text-faint)] sm:px-6">Previewing as “{roleOverride}” — switch any time from Settings → Branches.</p>}
    </>
  );
}
