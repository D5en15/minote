import { ArrowRight, FileText, Lock, Sparkles } from "lucide-react";

import { LoginPanel } from "@/components/auth/login-panel";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            Minote
          </div>
          <a
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            href="#signin"
          >
            Sign in
          </a>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
              <Sparkles className="size-4" aria-hidden="true" />
              Private notes, ready to share when you are
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Minote is a quiet place to write, save, and publish polished notes.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Start with a focused writing surface, keep every note private by
              default, and share read-only pages without giving up control.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto">
                Start writing
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Import guest notes
              </Button>
            </div>
          </div>

          <div className="space-y-4" id="signin">
            <LoginPanel />
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div>
                  <p className="text-sm font-medium">Today&apos;s note</p>
                  <p className="text-xs text-muted-foreground">Autosave ready</p>
                </div>
                <Lock
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-semibold">Launch notes</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    A clean draft space for ideas, decisions, and links worth
                    keeping. Sharing stays explicit, private notes stay private.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">Private by default</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Share links are opt-in and revocable.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">Revision aware</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Saves are designed to avoid silent overwrites.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
