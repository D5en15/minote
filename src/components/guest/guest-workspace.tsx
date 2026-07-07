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

const PLAN_META = {
  free: {
    name: "Zen Free",
    subtitle: "Best for trying out Minote workspace.",
    priceAmount: "$0",
    priceCadence: "/ month",
    helperText: "Start writing in the cloud with essential limits.",
    badge: null,
    ctaLabel: "Get Started for Free",
    ctaVariant: "outline" as const,
    accentClassName: "border-border",
    featureIconClassName: "text-emerald-500",
    features: [
      "3 new notes per day limit",
      "Max 50 total notes storage",
      "3 tags limit per note",
      "Standard Poppins font formatting",
      "Minote branding watermark included on shared links",
    ],
  },
  pro: {
    name: "Zen Pro",
    subtitle: "For creators, freelancers, and writers who need unlimited focus.",
    monthlyAmount: "$4.99",
    monthlyCadence: "/ month",
    monthlyHelperText: "Unlimited notes, tags, and Lora typography",
    yearlyAmount: "$47.88",
    yearlyCadence: "/ year",
    yearlyHelperText: "$3.99/mo billed yearly",
    badge: "Best Value",
    ctaVariant: "default" as const,
    accentClassName: "border-primary/40 bg-primary/5",
    featureIconClassName: "text-emerald-500",
    features: [
      "Unlimited notes creation & cloud storage",
      "Unlimited tags per note",
      "Premium serif font option (Lora)",
      "Advanced focus mode features (Phase 2 Ready)",
    ],
  },
  studio: {
    name: "Zen Studio",
    subtitle: "For professional writers, agencies, and personal brands.",
    monthlyAmount: "$11.99",
    monthlyCadence: "/ month",
    monthlyHelperText: "Whitelabel sharing and metadata controls",
    yearlyAmount: "$115.08",
    yearlyCadence: "/ year",
    yearlyHelperText: "$9.59/mo billed yearly",
    badge: "Whitelabel",
    ctaVariant: "studio" as const,
    accentClassName: "border-purple-500/30",
    featureIconClassName: "text-purple-500",
    features: [
      "Includes all Zen Pro features",
      'Watermark Whitelabel (Hide "Powered by Minote")',
      "Customizable shared page metadata layout settings",
      "Priority Routing Support channels",
    ],
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

  function getPlanPrice(plan: "pro" | "studio") {
    const meta = PLAN_META[plan];
    if (billingCycle === "yearly") {
      return {
        amount: meta.yearlyAmount,
        cadence: meta.yearlyCadence,
        helperText: meta.yearlyHelperText,
        buttonLabel:
          plan === "pro" ? "Upgrade Pro Yearly" : "Upgrade Studio Yearly",
      };
    }

    return {
      amount: meta.monthlyAmount,
      cadence: meta.monthlyCadence,
      helperText: meta.monthlyHelperText,
      buttonLabel:
        plan === "pro" ? "Upgrade Pro Monthly" : "Upgrade Studio Monthly",
    };
  }

  function getPlanButtonClassName(plan: "free" | "pro" | "studio") {
    if (plan === "studio") {
      return "w-full bg-purple-600 text-white hover:bg-purple-700";
    }

    return "w-full";
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
              Pick the plan that matches your writing workflow, then switch billing cadence any time.
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

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="space-y-3">
                <h3 className="text-2xl font-bold font-sans">{PLAN_META.free.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {PLAN_META.free.subtitle}
                </p>
                <div className="pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-sans">
                      {PLAN_META.free.priceAmount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {PLAN_META.free.priceCadence}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {PLAN_META.free.helperText}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        className={getPlanButtonClassName("free")}
                        type="button"
                        variant={PLAN_META.free.ctaVariant}
                      >
                        {PLAN_META.free.ctaLabel}
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

              <ul className="mt-6 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
                {PLAN_META.free.features.map((feature) => (
                  <li className="flex items-start gap-3" key={feature}>
                    <Check
                      className={`mt-0.5 size-4 shrink-0 ${PLAN_META.free.featureIconClassName}`}
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative flex flex-col rounded-lg border-2 border-primary/40 bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:bg-[#121212]">
              <div className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                {PLAN_META.pro.badge}
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold font-sans text-primary">{PLAN_META.pro.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {PLAN_META.pro.subtitle}
                </p>
                <div className="pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-sans">
                      {getPlanPrice("pro").amount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {getPlanPrice("pro").cadence}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {getPlanPrice("pro").helperText}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button className={getPlanButtonClassName("pro")} type="button">
                        {getPlanPrice("pro").buttonLabel}
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

              <ul className="mt-6 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
                {PLAN_META.pro.features.map((feature) => (
                  <li className="flex items-start gap-3" key={feature}>
                    <Check
                      className={`mt-0.5 size-4 shrink-0 ${PLAN_META.pro.featureIconClassName}`}
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative flex flex-col rounded-lg border-2 border-purple-500/30 bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:bg-[#121212]">
              <div className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-purple-600 px-3 py-0.5 text-xs font-semibold text-white">
                {PLAN_META.studio.badge}
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold font-sans text-purple-600 dark:text-purple-400">
                  {PLAN_META.studio.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {PLAN_META.studio.subtitle}
                </p>
                <div className="pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-sans">
                      {getPlanPrice("studio").amount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {getPlanPrice("studio").cadence}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {getPlanPrice("studio").helperText}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button className={getPlanButtonClassName("studio")} type="button">
                        {getPlanPrice("studio").buttonLabel}
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

              <ul className="mt-6 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
                {PLAN_META.studio.features.map((feature) => (
                  <li className="flex items-start gap-3" key={feature}>
                    <Check
                      className={`mt-0.5 size-4 shrink-0 ${PLAN_META.studio.featureIconClassName}`}
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
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
