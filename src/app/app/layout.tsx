import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { getCurrentProfile } from "@/server/auth";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/");
  }

  return (
    <AppShell
      user={{
        email: profile.email,
        displayName: profile.display_name,
        role: profile.role,
      }}
    >
      {children}
    </AppShell>
  );
}
