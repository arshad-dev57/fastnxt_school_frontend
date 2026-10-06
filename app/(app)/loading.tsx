import { TablePageSkeleton } from "@/components/skeleton";

/* Route-level loading UI (Next.js App Router).
   The AppShell — sidebar, header, top bar — stays mounted and interactive;
   only this page content area transitions into the shimmer state. */
export default function Loading() {
  return <TablePageSkeleton rows={8} cols={5} />;
}
