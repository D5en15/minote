"use client";

import { useEffect, useState, useTransition } from "react";
import { BadgeDollarSign, Check, Loader2, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type BillingStatus = {
  isPremium: boolean;
  tier: "free" | "pro" | "studio";
  planId: string;
  planName: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
  noteLimit: number;
  dailyCreateLimit: number;
  maxTagsPerNote: number | null;
  canUseLoraShareFont: boolean;
  canHideShareBranding: boolean;
  canHideShareMetadata: boolean;
  canUseAdvancedFocus: boolean;
  canAccessPrioritySupport: boolean;
  isInGracePeriod: boolean;
};

export default function BillingClientPage() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isYearly, setIsYearly] = useState(false);
  const [checkoutPending, startCheckout] = useTransition();
  const [portalPending, startPortal] = useTransition();

  const successParam = searchParams.get("success");
  const canceledParam = searchParams.get("canceled");

  useEffect(() => {
    let active = true;

    async function loadBilling() {
      try {
        const res = await fetch("/api/billing/status");
        if (!res.ok) throw new Error("Failed to load billing status");
        const json = await res.json();
        if (json.ok && active) {
          setBilling(json.data);
        }
      } catch (err) {
        console.error(err);
        if (active) setError("Could not load billing status. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBilling();
    return () => {
      active = false;
    };
  }, []);

  async function handleCheckout(priceId: string) {
    setError("");
    startCheckout(async () => {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ priceId }),
        });
        const json = await res.json();
        if (res.ok && json.ok && json.data?.url) {
          window.location.href = json.data.url;
        } else {
          setError(json.error?.message || "Checkout session failed to start.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  async function handleManageBilling() {
    setError("");
    startPortal(async () => {
      try {
        const res = await fetch("/api/billing/portal", {
          method: "POST",
        });
        const json = await res.json();
        if (res.ok && json.ok && json.data?.url) {
          window.location.href = json.data.url;
        } else {
          setError(json.error?.message || "Billing portal session failed to start.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  function formatPeriodEnd(isoString: string | null) {
    if (!isoString) return "";
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(isoString));
  }

  const proPrice = isYearly
    ? {
        amount: "$47.88",
        cadence: "/ year",
        detail: "$3.99/mo billed yearly",
        buttonLabel: "Upgrade Pro Yearly",
        priceId: "price_premium_yearly",
      }
    : {
        amount: "$4.99",
        cadence: "/ month",
        detail: "Unlimited notes, tags, and Lora typography",
        buttonLabel: "Upgrade Pro Monthly",
        priceId: "price_premium_monthly",
      };

  const studioPrice = isYearly
    ? {
        amount: "$115.08",
        cadence: "/ year",
        detail: "$9.59/mo billed yearly",
        buttonLabel: "Upgrade Studio Yearly",
        priceId: "price_studio_yearly",
      }
    : {
        amount: "$11.99",
        cadence: "/ month",
        detail: "Whitelabel sharing and metadata controls",
        buttonLabel: "Upgrade Studio Monthly",
        priceId: "price_studio_monthly",
      };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="border-b border-border pb-5">
        <p className="text-sm text-muted-foreground">Plan and subscription</p>
        <h2 className="text-2xl font-semibold">Billing</h2>
      </div>

      {successParam === "true" && (
        <div className="mt-4 rounded-md border border-emerald-500 bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
          <p className="font-semibold text-sm">Checkout Completed!</p>
          <p className="text-xs mt-1">Thank you for subscribing to Minote Premium. Your subscription is active now.</p>
        </div>
      )}

      {canceledParam === "true" && (
        <div className="mt-4 rounded-md border border-amber-500 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
          <p className="font-semibold text-sm">Checkout Canceled</p>
          <p className="text-xs mt-1">The checkout flow was canceled. No charges were made.</p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {billing?.isInGracePeriod ? (
        <div className="mt-4 rounded-md border border-amber-500 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
          <p className="text-sm font-semibold">Payment issue detected</p>
          <p className="mt-1 text-xs">
            Your subscription is in grace period. Premium features remain available
            temporarily while payment is resolved.
          </p>
        </div>
      ) : null}

      {/* Plan status display */}
      <div className="mt-6 rounded-md border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-muted">
              {billing?.isPremium ? (
                <Sparkles className="size-5 text-amber-500" aria-hidden="true" />
              ) : (
                <BadgeDollarSign className="size-5 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {billing?.planName || "Free plan"}
                {billing?.isPremium && (
                  <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600 font-medium">
                    Premium Active
                  </span>
                )}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {billing?.isPremium ? (
                  <>
                    Your subscription is currently <strong>{billing.subscriptionStatus}</strong>.
                    {billing.currentPeriodEnd && (
                      <span className="block mt-1 text-xs">
                        Next renewal date: {formatPeriodEnd(billing.currentPeriodEnd)}
                        {billing.cancelAtPeriodEnd && " (Will cancel at the end of the period)"}
                      </span>
                    )}
                  </>
                ) : (
                  `Current free limits: ${billing?.dailyCreateLimit ?? 3} new notes per day, ${billing?.noteLimit ?? 50} total notes, and ${billing?.maxTagsPerNote ?? 3} tags per note.`
                )}
              </p>
            </div>
          </div>

          {billing?.isPremium && (
            <Button
              className="mt-3 sm:mt-0"
              disabled={portalPending}
              onClick={handleManageBilling}
              variant="outline"
            >
              {portalPending ? (
                <Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" />
              ) : null}
              Manage Billing
            </Button>
          )}
        </div>
      </div>

      {/* Pricing options list if not premium */}
      {!billing?.isPremium && (
        <div className="mt-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-bold font-sans">Choose your Zen plan</h3>
            <p className="text-sm text-muted-foreground">Unlock unlimited potential with our clean writing environment workspace.</p>
          </div>

          <div className="flex justify-center">
            <div className="inline-flex rounded-full border border-border bg-muted/60 p-1 shadow-sm">
              <button
                type="button"
                aria-pressed={!isYearly}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  !isYearly
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setIsYearly(false)}
              >
                Monthly
              </button>
              <button
                type="button"
                aria-pressed={isYearly}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isYearly
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setIsYearly(true)}
              >
                Yearly
                <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Zen Pro Plan Card */}
            <div className="flex flex-col justify-between rounded-lg border-2 border-border bg-card p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold font-sans text-primary">Zen Pro</h4>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary font-semibold">
                    Best Value
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  For creators, freelancers, and writers who need unlimited notes, tags, and custom serif typography (Lora).
                </p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold font-sans">{proPrice.amount}</span>
                    <span className="text-sm text-muted-foreground">{proPrice.cadence}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{proPrice.detail}</p>
                  <Button
                    className="mt-4 w-full font-semibold"
                    disabled={checkoutPending}
                    onClick={() => handleCheckout(proPrice.priceId)}
                  >
                    {checkoutPending ? (
                      <Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" />
                    ) : null}
                    {proPrice.buttonLabel}
                  </Button>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-muted-foreground border-t border-border pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" />
                    <span>Unlimited notes creation & storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" />
                    <span>Unlimited tags per note</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" />
                    <span>Premium serif font option (Lora)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" />
                    <span>Advanced focus mode features (Phase 2 Ready)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Zen Studio Plan Card */}
            <div className="flex flex-col justify-between rounded-lg border-2 border-purple-500/30 bg-card p-6 shadow-sm relative">
              <div className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-purple-600 px-3 py-0.5 text-xs font-semibold text-white">
                White-label
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold font-sans text-purple-600 dark:text-purple-400">Zen Studio</h4>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  For professional writers and personal brands. Completely remove Minote branding and customize shared metadata.
                </p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold font-sans">{studioPrice.amount}</span>
                    <span className="text-sm text-muted-foreground">{studioPrice.cadence}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{studioPrice.detail}</p>
                  <Button
                    className="mt-4 w-full bg-purple-600 text-white font-semibold hover:bg-purple-700"
                    disabled={checkoutPending}
                    onClick={() => handleCheckout(studioPrice.priceId)}
                  >
                    {checkoutPending ? (
                      <Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" />
                    ) : null}
                    {studioPrice.buttonLabel}
                  </Button>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-muted-foreground border-t border-border pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-purple-500 shrink-0" />
                    <span>Includes all Zen Pro features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-purple-500 shrink-0" />
                    <span>Watermark Whitelabel (Hide &quot;Powered by Minote&quot;)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-purple-500 shrink-0" />
                    <span>Customizable metadata layout settings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-purple-500 shrink-0" />
                    <span>Priority Routing Support channels</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
