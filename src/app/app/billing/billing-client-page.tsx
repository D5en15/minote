"use client";

import { useEffect, useState, useTransition } from "react";
import { BadgeDollarSign, Check, Loader2, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type BillingStatus = {
  isPremium: boolean;
  planId: string;
  planName: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
};

// In real Stripe config, these Price IDs are loaded from env variables, but in MVP client we can define default keys for mock checkout
const MOCK_MONTHLY_PRICE_ID = "price_premium_monthly";
const MOCK_YEARLY_PRICE_ID = "price_premium_yearly";

export default function BillingClientPage() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
                  "Upgrade to write unlimited notes and create customized note shares."
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
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {/* Monthly Plan Option */}
          <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-6 shadow-sm">
            <div>
              <h4 className="text-lg font-semibold">Premium Monthly</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Zen editing space billed monthly. Cancel anytime.
              </p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-bold">$9</span>
                <span className="ml-1 text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Unlimited notes creation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Customizable read-only shares</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Password-protected shared pages</span>
                </li>
              </ul>
            </div>
            <Button
              className="mt-6 w-full"
              disabled={checkoutPending}
              onClick={() => handleCheckout(MOCK_MONTHLY_PRICE_ID)}
            >
              {checkoutPending ? (
                <Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" />
              ) : null}
              Upgrade Monthly
            </Button>
          </div>

          {/* Yearly Plan Option */}
          <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Premium Yearly</h4>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Save 20%
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Write note drafts consistently over a year with max savings.
              </p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-bold">$89</span>
                <span className="ml-1 text-sm text-muted-foreground">/year</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Unlimited notes creation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Customizable read-only shares</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>Password-protected shared pages</span>
                </li>
              </ul>
            </div>
            <Button
              className="mt-6 w-full"
              disabled={checkoutPending}
              onClick={() => handleCheckout(MOCK_YEARLY_PRICE_ID)}
            >
              {checkoutPending ? (
                <Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" />
              ) : null}
              Upgrade Yearly
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
