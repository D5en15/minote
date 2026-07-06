import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentProfile } from "@/server/auth";

export default async function AppHomePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8">
      <nav className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-sm text-muted-foreground">Minote workspace</p>
          <h1 className="text-2xl font-semibold">Notes</h1>
        </div>
        <LogoutButton />
      </nav>
      <section className="flex flex-1 items-center justify-center py-20 text-center">
        <div>
          <p className="text-lg font-medium">No notes yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your notes will appear here.
          </p>
        </div>
      </section>
    </main>
  );
}
