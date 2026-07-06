"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    router.replace("/");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" onClick={logout}>
      <LogOut className="size-4" aria-hidden="true" />
      Sign out
    </Button>
  );
}
