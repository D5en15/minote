"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  clearGuestNotes,
  confirmGuestImport,
  previewGuestImport,
  readGuestNotes,
} from "@/lib/guest-notes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GuestNote } from "@/types/guest-note";

type GuestImportPromptProps = {
  onImported?: () => void;
};

export function GuestImportPrompt({ onImported }: GuestImportPromptProps) {
  const router = useRouter();
  const [notes] = useState<GuestNote[]>(() => readGuestNotes());
  const [dialogOpen, setDialogOpen] = useState(() => readGuestNotes().length > 0);
  const [loading, setLoading] = useState(() => readGuestNotes().length > 0);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    importCount: number;
    renamedNotes: Array<{
      localId: string;
      originalTitle: string;
      finalTitle: string;
    }>;
  } | null>(null);

  useEffect(() => {
    if (notes.length === 0) {
      return;
    }

    void previewGuestImport(notes)
      .then((result) => {
        setPreview(result);
      })
      .catch((previewError) => {
        setError(
          previewError instanceof Error
            ? previewError.message
            : "Unable to preview guest import"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [notes]);

  const renamedCount = useMemo(
    () => preview?.renamedNotes.length ?? 0,
    [preview?.renamedNotes.length]
  );

  async function handleImport() {
    setLoading(true);
    setError("");

    try {
      await confirmGuestImport(notes);
      clearGuestNotes();
      setDialogOpen(false);
      onImported?.();
      router.refresh();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Unable to import guest notes"
      );
    } finally {
      setLoading(false);
    }
  }

  if (notes.length === 0) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import guest notes?</DialogTitle>
          <DialogDescription>
            These drafts were created before you signed in. Import will merge them
            into your cloud workspace without overwriting existing notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Preparing import…</span>
            </div>
          ) : preview ? (
            <>
              <p>{preview.importCount} guest notes are ready to import.</p>
              {renamedCount > 0 ? (
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <p className="font-medium">{renamedCount} note titles will be renamed</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {preview.renamedNotes.slice(0, 5).map((note) => (
                      <li key={note.localId}>
                        {note.originalTitle} {"\u2192"} {note.finalTitle}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}

          {error ? <p className="text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            disabled={loading}
            onClick={handleImport}
            type="button"
          >
            Import now
          </Button>
          <Button
            disabled={loading}
            onClick={() => setDialogOpen(false)}
            type="button"
            variant="outline"
          >
            Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
