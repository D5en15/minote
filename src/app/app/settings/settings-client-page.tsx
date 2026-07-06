"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Save, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

export default function SettingsClientPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [savePending, startSave] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const res = await fetch("/api/notes"); // Any auth request or specific api to load user details
        // To fetch profile cleanly let's load from database directly on layout or via helper status
        const statusRes = await fetch("/api/billing/status");
        const statusJson = await statusRes.json();
        
        // Fetch auth details via magic endpoint or metadata
        const profileRes = await fetch("/api/notes"); // note endpoint includes notes list, let's load notes status or check if we can fetch user profile
        // Alternatively, let's fetch profile details from our supabase session directly on client using browser helper or mock API,
        // but since we want it completely robust let's call a GET profile endpoint. Let's create one or look at notes endpoint.
      } catch (err) {
        console.error(err);
      }
    }

    // Let's create a dedicated GET profile status to fetch user metadata cleanly
    async function fetchProfileData() {
      try {
        const res = await fetch("/api/profile/status");
        if (!res.ok) throw new Error("Failed to load profile data");
        const json = await res.json();
        if (json.ok && active) {
          setProfile(json.data);
          setDisplayNameInput(json.data.display_name || "");
        }
      } catch (err) {
        console.error(err);
        if (active) setError("Could not load profile details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProfileData();

    return () => {
      active = false;
    };
  }, []);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!displayNameInput.trim()) {
      setError("Display name cannot be empty.");
      return;
    }

    startSave(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ displayName: displayNameInput }),
        });
        const json = await res.json();

        if (res.ok && json.ok) {
          setProfile(json.data.profile);
          setSuccessMsg("Profile updated successfully.");
        } else {
          setError(json.error?.message || "Failed to update profile settings.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  async function handleDeleteAccount() {
    setError("");
    setSuccessMsg("");
    setIsDeleteDialogOpen(false);

    startDelete(async () => {
      try {
        const res = await fetch("/api/account/delete-request", {
          method: "POST",
        });
        const json = await res.json();

        if (res.ok && json.ok) {
          // Success, redirect to logout
          window.location.href = "/api/auth/logout";
        } else {
          setError(json.error?.message || "Failed to submit account deletion request.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="border-b border-border pb-5">
        <p className="text-sm text-muted-foreground font-sans">Account preferences</p>
        <h2 className="text-2xl font-semibold font-sans">Settings</h2>
      </div>

      {successMsg && (
        <div className="rounded-md border border-emerald-500 bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="size-5 shrink-0" />
          <p className="font-sans text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive flex items-center gap-2">
          <AlertTriangle className="size-5 shrink-0" />
          <p className="font-sans text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Account Profile Form */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold font-sans">Profile Details</h3>
        <p className="text-sm text-muted-foreground font-sans mt-1">
          Manage your personal display name and email address.
        </p>

        <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium font-sans" htmlFor="email-display">
              Email Address
            </label>
            <Input
              id="email-display"
              value={profile?.email || ""}
              disabled
              className="bg-muted text-muted-foreground font-sans cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground font-sans">
              Email address is managed by your authentication provider.
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium font-sans" htmlFor="display-name">
              Display Name
            </label>
            <Input
              id="display-name"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              className="font-sans"
              placeholder="e.g. John Doe"
              maxLength={50}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button disabled={savePending} type="submit">
              {savePending ? (
                <Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" />
              ) : (
                <Save className="size-4 mr-2" aria-hidden="true" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Data Export Policy Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold font-sans">Data Portability Policy</h3>
        <p className="text-sm text-muted-foreground font-sans mt-1">
          You own your drafts and content. Export note data in structured Markdown documents directly from note workspaces inside your browser. All exported metadata conforms to open formats.
        </p>
      </div>

      {/* Account Deletion Section */}
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-destructive font-sans">Danger Zone</h3>
        <p className="text-sm text-muted-foreground font-sans mt-1">
          Permanently request account deletion. This action immediately revokes all public note shares, locks edit controls, and queues note database rows for automated deletion.
        </p>
        <div className="mt-6 flex justify-start">
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="destructive"
            disabled={deletePending}
          >
            {deletePending ? (
              <Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4 mr-2" aria-hidden="true" />
            )}
            Delete Account
          </Button>
        </div>
      </div>

      {/* Deletion confirmation modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans">Confirm Account Deletion</DialogTitle>
            <DialogDescription className="font-sans">
              Are you absolutely sure you want to delete your Minote account? This action is irreversible. All of your notes, tags, and public shared links will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="font-sans"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="font-sans"
            >
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
