import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import BillingClientPage from "./billing-client-page";

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      }
    >
      <BillingClientPage />
    </Suspense>
  );
}
