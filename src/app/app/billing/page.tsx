import { BadgeDollarSign } from "lucide-react";

export default function BillingPage() {
  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="border-b border-border pb-5">
        <p className="text-sm text-muted-foreground">Plan and subscription</p>
        <h2 className="text-2xl font-semibold">Billing</h2>
      </div>

      <div className="mt-6 rounded-md border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-muted">
            <BadgeDollarSign
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div>
            <h3 className="font-semibold">Free plan</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscription controls will be connected when billing integration is
              implemented.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
