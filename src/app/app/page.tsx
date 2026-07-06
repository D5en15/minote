import { FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppHomePage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col">
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">All notes</p>
          <h2 className="text-2xl font-semibold">Workspace</h2>
        </div>
        <Button type="button" disabled>
          <Plus className="size-4" aria-hidden="true" />
          New note
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center py-16 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-md border border-border bg-muted">
            <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No notes yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your notes will appear here after the notes API and editor are ready.
          </p>
        </div>
      </div>
    </section>
  );
}
