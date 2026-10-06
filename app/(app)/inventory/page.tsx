"use client";

import Link from "next/link";
import { Boxes, Server } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { rs } from "@/components/ui";
import { INVENTORY_ITEMS, type InventoryItemRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { "In Stock": "var(--theme-success)", "Low Stock": "var(--theme-warning)", "Out of Stock": "var(--theme-danger)" };

export default function InventoryPage() {
  return (
    <BranchBoard<InventoryItemRow>
      title="Inventory & Stock"
      subtitle="Consumables, stock levels, reorder alerts and suppliers per campus."
      Icon={Boxes}
      nameLabel="Item"
      countNoun="items"
      rows={INVENTORY_ITEMS}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.item}
      subtitleOf={(r) => `${r.category} · ${r.supplier}`}
      searchTextOf={(r) => `${r.item} ${r.category} ${r.supplier}`}
      primaryAction={
        <Link href="/assets" className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
          <Server className="ic-plus h-[18px] w-[18px]" /> Assets
        </Link>
      }
      columns={[
        { key: "category", label: "Category", width: "140px", cell: (r) => r.category },
        { key: "qty", label: "Qty", width: "110px", cell: (r) => `${r.qty} ${r.unit}` },
        { key: "reorder", label: "Reorder At", width: "110px", cell: (r) => r.reorder },
        { key: "supplier", label: "Supplier", width: "minmax(140px,1fr)", cell: (r) => r.supplier },
        { key: "value", label: "Value", width: "130px", cell: (r) => (r.value ? rs(r.value) : "—") },
        { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Item", value: r.item },
        { label: "Category", value: r.category },
        { label: "Quantity", value: `${r.qty} ${r.unit}` },
        { label: "Reorder Level", value: r.reorder },
        { label: "Supplier", value: r.supplier },
        { label: "Value", value: r.value ? rs(r.value) : "—" },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Category", value: r.category },
        { label: "Qty", value: `${r.qty} ${r.unit}` },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No inventory items"
      emptyMessage="No stock items match the current campus scope."
    />
  );
}
