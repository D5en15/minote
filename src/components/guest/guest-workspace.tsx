"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Moon,
  Sun,
  Layout,
  Lock,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoginPanel } from "@/components/auth/login-panel";

type ThemePreference = "light" | "dark";

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

export function GuestWorkspace() {
  const [theme, setTheme] = useState<ThemePreference>("light");

  useEffect(() => {
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("minote-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            Minote
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4" aria-hidden="true" />
              ) : (
                <Moon className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
          {/* Landing features introduction page */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-sans">
                A calm, private space for modern notes.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Minote is designed for focused writers who value simplicity, clean typography, and privacy. Jot down thoughts, tags, organize and sync to the cloud effortlessly.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layout className="size-4" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">Distraction-Free Editor</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Write down your thoughts in clean Markdown style without interface clutter.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock className="size-4" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">Private & Secure</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your notes are secured with modern encryption and access guards by default.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-2 sm:col-span-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="size-4" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">Instant Cloud Sync</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sign up for a cloud account to access sync, instant revisions, sharing links, and unlimited workspace backups.
                </p>
              </div>
            </div>
          </div>

          {/* Login or Register Panel */}
          <div className="flex flex-col justify-center">
            <div className="rounded-lg border border-border bg-card p-6 shadow-md space-y-4">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground font-medium">Save to cloud</p>
                <h2 className="text-xl font-bold font-sans">Login or register</h2>
              </div>
              <LoginPanel guestNotesCount={0} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
