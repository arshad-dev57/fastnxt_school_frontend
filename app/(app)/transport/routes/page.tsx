"use client";

import Link from "next/link";
import { Route as RouteIcon } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { rs } from "@/components/ui";
import { TRANSPORT_ROUTES, type RouteRow } from "@/lib/school-mock-data";

export default function TransportRoutesPage() {
  return (
    <BranchBoard<RouteRow>
      title="Transport Routes"
      subtitle="Route coverage, distances, passengers and monthly transport fee."
      Icon={RouteIcon}
      nameLabel="Route"
      countNoun="routes"
      rows={TRANSPORT_ROUTES}
      nameOf={(r) => r.name}
      subtitleOf={(r) => `${r.stops} stops · ${r.distance}`}
      searchTextOf={(r) => `${r.name} ${r.distance}`}
      primaryAction={
        <Link href="/transport" className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]">
          ← Fleet
        </Link>
      }
      columns={[
        { key: "stops", label: "Stops", width: "100px", cell: (r) => r.stops },
        { key: "dist", label: "Distance", width: "120px", cell: (r) => r.distance },
        { key: "students", label: "Students", width: "120px", cell: (r) => r.students },
        { key: "fee", label: "Monthly Fee", width: "150px", cell: (r) => rs(r.monthlyFee) },
      ]}
      detailFields={(r) => [
        { label: "Route", value: r.name },
        { label: "Stops", value: r.stops },
        { label: "Distance", value: r.distance },
        { label: "Students", value: r.students },
        { label: "Monthly Fee", value: rs(r.monthlyFee) },
      ]}
      mobileRows={(r) => [
        { label: "Stops", value: r.stops },
        { label: "Students", value: r.students },
        { label: "Fee", value: rs(r.monthlyFee) },
      ]}
      emptyTitle="No routes"
      emptyMessage="No transport routes match the current campus scope."
    />
  );
}
