"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Moon,
  Sun,
  Layout,
  Lock,
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoginPanel } from "@/components/auth/login-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <section className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            Minote
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => scrollToSection("features")}
              variant="ghost"
              className="text-sm font-medium"
            >
              Features
            </Button>
            <Button
              onClick={() => scrollToSection("pricing")}
              variant="ghost"
              className="text-sm font-medium"
            >
              Pricing
            </Button>
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
        </section>
      </header>

      {/* Center Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-8 lg:px-10 max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl font-sans max-w-3xl leading-[1.1]">
            A calm, private space for your modern notes.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Write cleanly, structure with tags, and sync securely to the cloud. Designed specifically for writers who value focus and absolute privacy.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          {/* Dialog popup for Login and Register Panel */}
          <Dialog>
            <DialogTrigger render={
              <Button size="lg" className="w-full sm:w-auto text-base font-semibold px-8 py-6 rounded-lg gap-2 cursor-pointer shadow-md">
                Get started free
                <ArrowRight className="size-5" />
              </Button>
            } />
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-sans text-center mb-2">Login or register</DialogTitle>
              </DialogHeader>
              <div className="p-1">
                <LoginPanel guestNotesCount={0} />
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => scrollToSection("features")}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-base font-semibold px-8 py-6 rounded-lg cursor-pointer"
          >
            Learn more
          </Button>
        </div>
      </section>

      {/* Features Detail Section */}
      <section id="features" className="w-full border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-sans">
              Everything you need to capture ideas.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              No bloating toolbars or complex layouts. Minote gets out of your way so you can write.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layout className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold">Distraction-Free Editor</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Write down your thoughts in clean Markdown style without interface clutter. Beautiful fonts and custom alignments included.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lock className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold">Private & Secure</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your notes are secured with modern encryption and access guards by default. Full owner-only control rules applied.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold">Instant Cloud Sync</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sign up to access sync, instant revisions history, quick public sharing links, and unlimited database backups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section id="pricing" className="w-full border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-sans">
              Simple, transparent pricing.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Start capturing your thoughts today for free, or upgrade anytime for full premium options.
            </p>
          </div>

          <div className="grid gap-8 max-w-4xl mx-auto md:grid-cols-2">
            {/* Free Plan */}
            <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-8 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold font-sans">Free Plan</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Capture basic ideas and test the waters.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-sans">$0</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground border-t border-border pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-primary" />
                    Up to 50 active notes limit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-primary" />
                    Up to 10 active tags
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-primary" />
                    Standard markdown exports
                  </li>
                </ul>
              </div>
              <Dialog>
                <DialogTrigger render={
                  <Button variant="outline" className="mt-8 w-full py-6 rounded-lg cursor-pointer font-semibold">
                    Get started
                  </Button>
                } />
                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold font-sans text-center mb-2">Login or register</DialogTitle>
                  </DialogHeader>
                  <div className="p-1">
                    <LoginPanel guestNotesCount={0} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Pro Plan */}
            <div className="flex flex-col justify-between rounded-lg border-2 border-primary bg-card p-8 shadow-md relative">
              <div className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold font-sans">Pro Plan</h3>
                  <p className="mt-2 text-sm text-muted-foreground">For creators and heavy writers who need sync and sharing.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-sans">$8</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground border-t border-border pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-primary" />
                    Unlimited cloud notes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-primary" />
                    Unlimited custom tags
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-primary" />
                    Public read-only sharing links
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-primary" />
                    Secure revision history backups
                  </li>
                </ul>
              </div>
              <Dialog>
                <DialogTrigger render={
                  <Button className="mt-8 w-full py-6 rounded-lg cursor-pointer font-semibold">
                    Upgrade now
                  </Button>
                } />
                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold font-sans text-center mb-2">Login or register</DialogTitle>
                  </DialogHeader>
                  <div className="p-1">
                    <LoginPanel guestNotesCount={0} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="w-full border-t border-border py-8 mt-auto bg-muted/10">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground sm:px-8 lg:px-10">
          <p>&copy; {new Date().getFullYear()} Minote. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
