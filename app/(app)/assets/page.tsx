"use client";

import Link from "next/link";
import { Server, Boxes } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { rs } from "@/components/ui";
import { ASSETS, type AssetRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { "In Use": "var(--theme-success)", "In Store": "var(--theme-info)", Repair: "var(--theme-warning)", Disposed: "var(--theme-pending)" };

export default function AssetsPage() {
  return (
    <BranchBoard<AssetRow>
      title="Asset Register"
      subtitle="Capital assets with tags, locations, assignees and warranty status."
      Icon={Server}
      nameLabel="Asset"
      countNoun="assets"
      rows={ASSETS}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.name}
      subtitleOf={(r) => `${r.tag} · ${r.category}`}
      searchTextOf={(r) => `${r.name} ${r.tag} ${r.category} ${r.location} ${r.assignee}`}
      primaryAction={
        <Link href="/inventory" className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]">
          <Boxes className="h-[18px] w-[18px]" /> Inventory
        </Link>
      }
      columns={[
        { key: "tag", label: "Asset No.", width: "120px", cell: (r) => r.tag },
        { key: "location", label: "Location", width: "minmax(140px,1fr)", cell: (r) => r.location },
        { key: "assignee", label: "Assigned To", width: "minmax(140px,1fr)", cell: (r) => r.assignee },
        { key: "cost", label: "Cost", width: "140px", cell: (r) => rs(r.cost) },
        { key: "warranty", label: "Warranty", width: "120px", cell: (r) => r.warranty },
        { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Asset", value: r.name },
        { label: "Asset No.", value: r.tag },
        { label: "Category", value: r.category },
        { label: "Purchased", value: r.purchaseDate },
        { label: "Cost", value: rs(r.cost) },
        { label: "Location", value: r.location },
        { label: "Assigned To", value: r.assignee },
        { label: "Warranty", value: r.warranty },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Tag", value: r.tag },
        { label: "Location", value: r.location },
        { label: "Cost", value: rs(r.cost) },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No assets"
      emptyMessage="No assets match the current campus scope."
    />
  );
}
