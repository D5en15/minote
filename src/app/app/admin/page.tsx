import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/server/auth";
import AdminClientPage from "./admin-client-page";

export default async function AdminPage() {
  // 1. Guard route: redirect non-admin roles immediately
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/app");
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      }
    >
      <AdminClientPage />
    </Suspense>
  );
}
