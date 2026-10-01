"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-[calc(100dvh-112px)] items-center justify-center px-4">
      <Card pad className="max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D6F5E3] text-[#037F4C]">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <div>
            <h1 className="text-[20px] font-bold">Logged out successfully</h1>
            <p className="mt-2 text-[14px] text-[#676879]">Redirecting to home page...</p>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
        </div>
      </Card>
    </div>
  );
}
