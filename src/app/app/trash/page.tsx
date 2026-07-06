import { Trash2 } from "lucide-react";

export default function TrashPage() {
  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="border-b border-border pb-5">
        <p className="text-sm text-muted-foreground">Deleted notes</p>
        <h2 className="text-2xl font-semibold">Trash</h2>
      </div>

      <div className="flex min-h-[22rem] items-center justify-center text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-md border border-border bg-muted">
            <Trash2 className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Trash is empty</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Deleted notes will stay here before permanent removal.
          </p>
        </div>
      </div>
    </section>
  );
}
