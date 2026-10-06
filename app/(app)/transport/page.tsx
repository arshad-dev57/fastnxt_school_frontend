"use client";

import Link from "next/link";
import { Bus, Route as RouteIcon } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { VEHICLES, type VehicleRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { Active: "var(--theme-success)", Maintenance: "var(--theme-warning)", Inactive: "var(--theme-pending)" };

export default function TransportPage() {
  return (
    <BranchBoard<VehicleRow>
      title="Transport — Fleet"
      subtitle="Vehicles, drivers, routes and fitness status for the campus."
      Icon={Bus}
      nameLabel="Vehicle"
      countNoun="vehicles"
      rows={VEHICLES}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => `${r.number} · ${r.type}`}
      subtitleOf={(r) => `${r.driver} · ${r.route}`}
      searchTextOf={(r) => `${r.number} ${r.type} ${r.driver} ${r.route}`}
      primaryAction={
        <Link href="/transport/routes" className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
          <RouteIcon className="ic-plus h-[18px] w-[18px]" /> Routes
        </Link>
      }
      columns={[
        { key: "driver", label: "Driver", width: "minmax(150px,1fr)", cell: (r) => r.driver },
        { key: "route", label: "Route", width: "minmax(180px,1.2fr)", cell: (r) => r.route },
        { key: "cap", label: "Capacity", width: "100px", cell: (r) => r.capacity },
        { key: "fitness", label: "Fitness Expiry", width: "140px", cell: (r) => r.fitness },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Vehicle", value: `${r.number} (${r.type})` },
        { label: "Driver", value: r.driver },
        { label: "Route", value: r.route },
        { label: "Capacity", value: r.capacity },
        { label: "Fitness Expiry", value: r.fitness },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Driver", value: r.driver },
        { label: "Capacity", value: r.capacity },
        { label: "Fitness", value: r.fitness },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No vehicles"
      emptyMessage="No fleet records match the current campus scope."
    />
  );
}
