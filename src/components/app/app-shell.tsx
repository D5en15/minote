"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  FileText,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Trash2,
  User,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppShellUser = {
  email: string;
  displayName: string | null;
};

type AppShellProps = {
  user: AppShellUser;
  children: ReactNode;
};

type ThemePreference = "light" | "dark";

const navItems = [
  {
    href: "/app",
    label: "Workspace",
    icon: FileText,
    match: (pathname: string) => pathname === "/app",
  },
  {
    href: "/app/trash",
    label: "Trash",
    icon: Trash2,
    match: (pathname: string) => pathname.startsWith("/app/trash"),
  },
  {
    href: "/app/billing",
    label: "Billing",
    icon: BadgeDollarSign,
    match: (pathname: string) => pathname.startsWith("/app/billing"),
  },
  {
    href: "/app/settings",
    label: "Settings",
    icon: Settings,
    match: (pathname: string) => pathname.startsWith("/app/settings"),
  },
];

function getInitials(user: AppShellUser) {
  const source = user.displayName || user.email;
  const parts = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "M";
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/app/trash")) {
    return "Trash";
  }

  if (pathname.startsWith("/app/billing")) {
    return "Billing";
  }

  if (pathname.startsWith("/app/settings")) {
    return "Settings";
  }

  return "Workspace";
}

function getPreferredTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("minote-theme");

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(getPreferredTheme);
  const initials = useMemo(() => getInitials(user), [user]);
  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    window.localStorage.setItem("minote-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    window.localStorage.setItem("minote-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    router.replace("/");
    router.refresh();
  }

  const sidebar = (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <Link className="flex items-center gap-2 font-semibold" href="/app">
          <span className="grid size-8 place-items-center rounded-md bg-sidebar-primary text-sm text-sidebar-primary-foreground">
            M
          </span>
          <span>Minote</span>
        </Link>
        <Button
          aria-label="Close navigation"
          className="md:hidden"
          onClick={() => setMobileNavOpen(false)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Workspace">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active &&
                  "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
              )}
              href={item.href}
              key={item.href}
              onClick={() => setMobileNavOpen(false)}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.displayName || "Minote user"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:block">
        {sidebar}
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-background/70"
            onClick={() => setMobileNavOpen(false)}
            type="button"
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              aria-label="Open navigation"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Menu className="size-4" aria-hidden="true" />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground">
                Minote workspace
              </p>
              <h1 className="truncate text-lg font-semibold leading-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
              onClick={toggleTheme}
              size="icon"
              type="button"
              variant="outline"
            >
              {theme === "dark" ? (
                <Sun className="size-4" aria-hidden="true" />
              ) : (
                <Moon className="size-4" aria-hidden="true" />
              )}
            </Button>

            <div className="relative">
              <Button
                aria-expanded={userMenuOpen}
                aria-label="Open user menu"
                onClick={() => setUserMenuOpen((open) => !open)}
                size="icon"
                type="button"
                variant="outline"
              >
                <User className="size-4" aria-hidden="true" />
              </Button>

              {userMenuOpen ? (
                <div className="absolute right-0 mt-2 w-64 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
                  <div className="px-2 py-2">
                    <p className="truncate text-sm font-medium">
                      {user.displayName || "Minote user"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <button
                    className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-destructive hover:bg-destructive/10"
                    onClick={logout}
                    type="button"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
