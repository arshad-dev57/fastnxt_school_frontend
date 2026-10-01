"use client";

import { useMemo, useState } from "react";
import { Plus, ShieldCheck, Save, CheckCircle2, Users, Lock } from "lucide-react";
import { Badge, Btn, Card, CardHead, Checkbox, Modal, PageHeader, Toggle, cn } from "@/components/ui";
import { PERMISSION_GROUPS, USER_ROLES } from "@/lib/mock-data";

const keyOf = (m: string, a: string) => `${m}::${a}`;

export default function RolesPermissionsPage() {
  const [role, setRole] = useState<string>(USER_ROLES[0]);
  const [roles, setRoles] = useState<string[]>([...USER_ROLES]);
  const [newRole, setNewRole] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [saved, setSaved] = useState(false);

  const [perms, setPerms] = useState<Record<string, boolean>>(() => {
    const all: Record<string, boolean> = {};
    PERMISSION_GROUPS.forEach((g) => g.actions.forEach((a) => { all[keyOf(g.module, a)] = true; }));
    return all;
  });

  const total = useMemo(() => PERMISSION_GROUPS.reduce((a, g) => a + g.actions.length, 0), []);
  const granted = useMemo(() => Object.values(perms).filter(Boolean).length, [perms]);

  const toggle = (m: string, a: string) => setPerms((p) => ({ ...p, [keyOf(m, a)]: !p[keyOf(m, a)] }));

  const toggleModule = (m: string, on: boolean) =>
    setPerms((p) => {
      const next = { ...p };
      PERMISSION_GROUPS.find((g) => g.module === m)?.actions.forEach((a) => { next[keyOf(m, a)] = on; });
      return next;
    });

  const moduleAll = (m: string) => PERMISSION_GROUPS.find((g) => g.module === m)?.actions.every((a) => perms[keyOf(m, a)]) ?? false;

  const addRole = () => {
    const name = roleName.trim();
    if (!name) return;
    setRoles((p) => [...p, name]);
    setRole(name);
    setRoleName(""); setNewRole(false);
  };

  return (
    <>
      <PageHeader title="Roles & Permissions" subtitle="Control what each role can view and manage across modules."
        actions={<Btn variant="primary" Icon={Save} onClick={() => setSaved(true)}>Save Permissions</Btn>} />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 lg:grid-cols-4">
        <Card pad={false} className="lg:col-span-1">
          <CardHead title="Roles" subtitle={`${roles.length} roles`} Icon={ShieldCheck}
            right={<Btn size="sm" variant="secondary" Icon={Plus} onClick={() => setNewRole(true)}>Add</Btn>} />
          <div className="space-y-1 p-2">
            {roles.map((r) => (
              <button key={r} onClick={() => setRole(r)}
                className={cn("flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-left text-[14px] transition-colors",
                  role === r ? "bg-[#CCE5FF] font-medium text-[#0060B9]" : "hover:bg-[#F5F6F8]")}>
                <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1 truncate">{r}</span>
                {role === r && <Badge label="Editing" tone="blue" />}
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-3">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E7DEFF] text-[#5A34D6]"><Lock className="h-5 w-5" /></span>
                <div>
                  <p className="text-[16px] font-semibold">{role}</p>
                  <p className="text-[13px] text-[#676879]">{granted} of {total} permissions granted</p>
                </div>
              </div>
              <Toggle checked onChange={() => {}} label="Role active" />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E6E9EF]">
              <div className="h-full rounded-full bg-[#6C47FF] transition-[width]" style={{ width: `${(granted / total) * 100}%` }} />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {PERMISSION_GROUPS.map((g) => (
              <Card key={g.module} pad={false}>
                <div className="flex items-center justify-between gap-2 border-b border-[#E6E9EF] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#0060B9]"><Users className="h-[18px] w-[18px]" /></span>
                    <p className="text-[15px] font-semibold">{g.module}</p>
                  </div>
                  <label className="flex items-center gap-2 text-[12px] text-[#676879]">
                    <Checkbox checked={moduleAll(g.module)} onChange={(v) => toggleModule(g.module, v)} /> All
                  </label>
                </div>
                <div className="space-y-1 p-3">
                  {g.actions.map((a) => (
                    <label key={a} className="flex items-center gap-3 rounded px-2 py-2 text-[14px] hover:bg-[#F5F6F8]">
                      <Checkbox checked={!!perms[keyOf(g.module, a)]} onChange={() => toggle(g.module, a)} />
                      <span className="flex-1">{a}</span>
                    </label>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Modal open={newRole} onClose={() => setNewRole(false)} title="Add Role" width="max-w-md"
        footer={<><Btn variant="secondary" onClick={() => setNewRole(false)}>Cancel</Btn><Btn variant="primary" onClick={addRole} disabled={!roleName.trim()}>Add Role</Btn></>}>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Role Name</span>
          <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Vice Principal"
            className="h-10 w-full rounded border border-[#C5C7D0] bg-white px-3 text-[14px] outline-none focus:border-[#2563EB]" />
        </label>
      </Modal>

      <Modal open={saved} onClose={() => setSaved(false)} title="Permissions saved" width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D6F5E3] text-[#037F4C]"><CheckCircle2 className="h-7 w-7" /></span>
          <p className="text-[15px] font-medium">Permissions for <span className="font-semibold">{role}</span> updated.</p>
          <p className="text-[13px] text-[#676879]">{granted} of {total} permissions are now enabled.</p>
        </div>
      </Modal>
    </>
  );
}
