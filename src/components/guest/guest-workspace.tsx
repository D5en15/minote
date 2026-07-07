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
  Check,
  Minus,
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
type BillingCycle = "monthly" | "yearly";

const MONTHLY_PRICE_IDS = {
  pro: "price_premium_monthly",
  studio: "price_studio_monthly",
} as const;

const YEARLY_PRICE_IDS = {
  pro: "price_premium_yearly",
  studio: "price_studio_yearly",
} as const;

const PRICING_ROWS = [
  {
    feature: "Daily Note Creation Limits",
    free: "3 notes/day",
    pro: "Unlimited",
    studio: "Unlimited",
  },
  {
    feature: "Total Note Cloud Storage",
    free: "Max 50 notes",
    pro: "Unlimited",
    studio: "Unlimited",
  },
  {
    feature: "Shared Page Typographies",
    free: "Poppins only",
    pro: "Lora Serif Option",
    studio: "Lora Serif Option",
  },
  {
    feature: "Minote Branding Watermark",
    free: "Included",
    pro: "Included",
    studio: "Whitelabel / Removed",
  },
  {
    feature: "Advanced Link Security",
    free: "No",
    pro: "No",
    studio: "Yes / Password-protected",
  },
] as const;

const PLAN_META = {
  free: {
    name: "Zen Free",
    monthlyLabel: "$0",
    monthlySubtext: "Forever free",
    yearlyLabel: "$0",
    yearlySubtext: "Forever free",
    badge: null,
  },
  pro: {
    name: "Zen Pro",
    monthlyLabel: "$4.99/mo",
    monthlySubtext: "For creators and writers",
    yearlyLabel: "$47.88/yr",
    yearlySubtext: "$3.99/mo billed yearly",
    badge: "Popular",
  },
  studio: {
    name: "Zen Studio",
    monthlyLabel: "$11.99/mo",
    monthlySubtext: "For brands and power users",
    yearlyLabel: "$115.08/yr",
    yearlySubtext: "$9.59/mo billed yearly",
    badge: "Whitelabel",
  },
} as const;

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
  const [theme, setTheme] = useState<ThemePreference>(getPreferredTheme);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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

  function getCheckoutPriceId(plan: "pro" | "studio") {
    return billingCycle === "yearly"
      ? YEARLY_PRICE_IDS[plan]
      : MONTHLY_PRICE_IDS[plan];
  }

  function renderMatrixValue(value: string) {
    const isPositiveValue =
      value === "Unlimited" ||
      value.startsWith("Yes") ||
      value.includes("Option") ||
      value.includes("Removed") ||
      value.includes("Included") ||
      value === "Forever free";

    return (
      <span className="inline-flex items-center gap-2">
        {isPositiveValue ? (
          <Check className="size-4 text-emerald-500" aria-hidden="true" />
        ) : (
          <Minus className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
        <span>{value}</span>
      </span>
    );
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

      {/* Pricing Matrix Section */}
      <section id="pricing" className="w-full border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-sans">
              Simple, transparent pricing.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Compare every plan side by side, then choose the billing cycle that fits your pace.
            </p>
          </div>

          <div className="mx-auto flex max-w-md items-center justify-center">
            <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
              <button
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  billingCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                ].join(" ")}
                onClick={() => setBillingCycle("monthly")}
                type="button"
              >
                Monthly
              </button>
              <button
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  billingCycle === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                ].join(" ")}
                onClick={() => setBillingCycle("yearly")}
                type="button"
              >
                Yearly <span className="text-emerald-600 dark:text-emerald-400">(Save 20%)</span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="grid min-w-[880px] grid-cols-[1.45fr_repeat(3,minmax(0,1fr))]">
              <div className="border-b border-border bg-muted/30 px-6 py-5">
                <p className="text-sm font-medium text-muted-foreground">
                  Feature comparison
                </p>
              </div>

              {(["free", "pro", "studio"] as const).map((planKey) => {
                const plan = PLAN_META[planKey];
                const priceLabel =
                  billingCycle === "yearly" ? plan.yearlyLabel : plan.monthlyLabel;
                const priceSubtext =
                  billingCycle === "yearly"
                    ? plan.yearlySubtext
                    : plan.monthlySubtext;

                return (
                  <div
                    className={[
                      "border-b border-l border-border px-6 py-5",
                      planKey === "pro" ? "bg-primary/5" : "bg-card",
                    ].join(" ")}
                    key={planKey}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        {plan.badge ? (
                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              planKey === "pro"
                                ? "bg-primary text-primary-foreground"
                                : "bg-foreground text-background",
                            ].join(" ")}
                          >
                            {plan.badge}
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-2xl font-semibold tracking-tight">
                          {priceLabel}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {priceSubtext}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {PRICING_ROWS.map((row) => (
                <div className="contents" key={row.feature}>
                  <div className="border-b border-border px-6 py-4 text-sm font-medium">
                    {row.feature}
                  </div>
                  <div className="border-b border-l border-border px-6 py-4 text-sm text-muted-foreground">
                    {renderMatrixValue(row.free)}
                  </div>
                  <div className="border-b border-l border-border bg-primary/5 px-6 py-4 text-sm text-muted-foreground">
                    {renderMatrixValue(row.pro)}
                  </div>
                  <div className="border-b border-l border-border px-6 py-4 text-sm text-muted-foreground">
                    {renderMatrixValue(row.studio)}
                  </div>
                </div>
              ))}

              <div className="px-6 py-5 text-sm text-muted-foreground">
                Choose your plan
              </div>
              <div className="border-l border-border px-6 py-5">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        className="w-full"
                        type="button"
                        variant="outline"
                      >
                        Get Started
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                      <DialogTitle className="text-center text-2xl font-bold font-sans mb-2">
                        Login or register
                      </DialogTitle>
                    </DialogHeader>
                    <div className="p-1">
                      <LoginPanel guestNotesCount={0} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="border-l border-border bg-primary/5 px-6 py-5">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button className="w-full" type="button">
                        {billingCycle === "yearly"
                          ? "Choose Pro Yearly"
                          : "Choose Pro Monthly"}
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                      <DialogTitle className="text-center text-2xl font-bold font-sans mb-2">
                        Login or register
                      </DialogTitle>
                    </DialogHeader>
                    <div className="p-1">
                      <LoginPanel
                        checkoutPriceId={getCheckoutPriceId("pro")}
                        guestNotesCount={0}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="border-l border-border px-6 py-5">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button className="w-full" type="button" variant="outline">
                        {billingCycle === "yearly"
                          ? "Choose Studio Yearly"
                          : "Choose Studio Monthly"}
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                      <DialogTitle className="text-center text-2xl font-bold font-sans mb-2">
                        Login or register
                      </DialogTitle>
                    </DialogHeader>
                    <div className="p-1">
                      <LoginPanel
                        checkoutPriceId={getCheckoutPriceId("studio")}
                        guestNotesCount={0}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
