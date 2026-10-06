"use client";

import { BedDouble } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { rs } from "@/components/ui";
import { HOSTEL_ROOMS, type HostelRoomRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { Occupied: "var(--theme-info)", Available: "var(--theme-success)", Blocked: "var(--theme-danger)" };

export default function HostelPage() {
  return (
    <BranchBoard<HostelRoomRow>
      title="Hostel & Boarding"
      subtitle="Rooms, beds, occupancy and wardens for the campus hostels."
      Icon={BedDouble}
      nameLabel="Room"
      countNoun="rooms"
      rows={HOSTEL_ROOMS}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => `${r.hostel} · ${r.room}`}
      subtitleOf={(r) => `${r.type} · Warden: ${r.warden}`}
      searchTextOf={(r) => `${r.hostel} ${r.room} ${r.type} ${r.warden}`}
      columns={[
        { key: "type", label: "Type", width: "110px", cell: (r) => r.type },
        { key: "occupancy", label: "Occupancy", width: "130px", cell: (r) => `${r.occupied}/${r.beds}` },
        { key: "warden", label: "Warden", width: "minmax(140px,1fr)", cell: (r) => r.warden },
        { key: "fee", label: "Monthly Fee", width: "140px", cell: (r) => rs(r.monthlyFee) },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Hostel", value: r.hostel },
        { label: "Room", value: r.room },
        { label: "Type", value: r.type },
        { label: "Occupancy", value: `${r.occupied} of ${r.beds} beds` },
        { label: "Warden", value: r.warden },
        { label: "Monthly Fee", value: rs(r.monthlyFee) },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Type", value: r.type },
        { label: "Occupancy", value: `${r.occupied}/${r.beds}` },
        { label: "Fee", value: rs(r.monthlyFee) },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No hostel rooms"
      emptyMessage="No hostel rooms match the current campus scope."
    />
  );
}
