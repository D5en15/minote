"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/browser";

type RequestState = "idle" | "loading" | "success" | "error";

type LoginPanelProps = {
  guestNotesCount?: number;
};

export function LoginPanel({ guestNotesCount = 0 }: LoginPanelProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");

  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const response = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data?: { message?: string };
      error?: { message: string };
    };

    if (!response.ok || !payload.ok) {
      setState("error");
      setMessage(payload.error?.message ?? "Unable to request sign-in link");
      return;
    }

    setState("success");
    setMessage(payload.data?.message ?? "Check your email for the sign-in link.");
  }

  async function signInWithGoogle() {
    setState("loading");
    setMessage("");

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState("error");
      setMessage("Unable to start Google sign-in");
    }
  }

  const isLoading = state === "loading";

  return (
    <div className="w-full rounded-lg border border-border bg-card p-4 shadow-sm">
      <form className="space-y-3" onSubmit={requestMagicLink}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
            aria-invalid={state === "error"}
            required
          />
        </div>
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Mail className="size-4" aria-hidden="true" />
          )}
          Send magic link
        </Button>
      </form>

      <div className="my-4 h-px bg-border" />

      <Button
        className="w-full"
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={signInWithGoogle}
      >
        Continue with Google
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>

      {message ? (
        <p
          className={
            state === "error"
              ? "mt-3 text-sm text-destructive"
              : "mt-3 text-sm text-muted-foreground"
          }
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}

      {guestNotesCount > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {guestNotesCount} guest notes are waiting to be imported after sign-in.
        </p>
      ) : null}
    </div>
  );
}
