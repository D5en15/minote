"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, RefreshCw, ShieldAlert, User, Clock, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuditLog = {
  id: string;
  actor_user_id: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AdminClientPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isPending, startUpdate] = useTransition();

  async function fetchLogs(currentPage: number, eventFilter: string, userFilter: string) {
    setError("");
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(currentPage));
    searchParams.set("limit", "25");
    if (eventFilter.trim()) searchParams.set("eventType", eventFilter.trim());
    if (userFilter.trim()) searchParams.set("userId", userFilter.trim());

    try {
      const res = await fetch(`/api/admin/audit-logs?${searchParams.toString()}`);
      const json = await res.json();
      if (res.ok && json.ok) {
        setLogs(json.data.logs);
        setPagination(json.data.pagination);
        setPage(json.data.pagination.page);
      } else {
        setError(json.error?.message || "Failed to load audit logs.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs(1, "", "");
  }, []);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    fetchLogs(1, eventTypeFilter, userIdFilter);
  }

  function handleRefresh() {
    setLoading(true);
    fetchLogs(page, eventTypeFilter, userIdFilter);
  }

  function handlePageChange(targetPage: number) {
    if (!pagination || targetPage < 1 || targetPage > pagination.totalPages) return;
    setLoading(true);
    fetchLogs(targetPage, eventTypeFilter, userIdFilter);
  }

  if (loading && logs.length === 0) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="border-b border-border pb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-sans">Security monitoring</p>
          <h2 className="text-2xl font-semibold font-sans flex items-center gap-2">
            <ShieldAlert className="size-6 text-amber-500" />
            Admin Audit Logs
          </h2>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <p className="font-sans text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Filter Options Panel */}
      <form onSubmit={handleFilterSubmit} className="grid gap-4 md:grid-cols-3 bg-card border border-border rounded-lg p-4 shadow-sm items-end">
        <div className="grid gap-2">
          <label className="text-sm font-medium font-sans" htmlFor="event-filter">
            Event Type
          </label>
          <Input
            id="event-filter"
            placeholder="e.g. note.created"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="font-sans text-sm"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium font-sans" htmlFor="user-filter">
            Actor User ID
          </label>
          <Input
            id="user-filter"
            placeholder="e.g. UUID"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="font-sans text-sm"
          />
        </div>
        <Button type="submit" className="font-sans">
          Apply Filters
        </Button>
      </form>

      {/* Logs Table Area */}
      <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 font-medium text-muted-foreground">
                <th className="p-4 font-sans">Timestamp</th>
                <th className="p-4 font-sans">Event Type</th>
                <th className="p-4 font-sans">Actor ID</th>
                <th className="p-4 font-sans">Entity Type</th>
                <th className="p-4 font-sans">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground font-sans">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-sans text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 shrink-0" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 font-sans font-medium whitespace-nowrap">
                      <span className="rounded bg-muted px-2.5 py-0.5 text-xs text-foreground/80 font-mono">
                        {log.event_type}
                      </span>
                    </td>
                    <td className="p-4 font-sans text-xs font-mono whitespace-nowrap text-muted-foreground">
                      {log.actor_user_id ? (
                        <div className="flex items-center gap-1">
                          <User className="size-3.5 shrink-0" />
                          <span className="truncate max-w-[120px]">{log.actor_user_id}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">system/visitor</span>
                      )}
                    </td>
                    <td className="p-4 font-sans text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Tag className="size-3.5 text-muted-foreground" />
                        <span>{log.entity_type}</span>
                      </div>
                    </td>
                    <td className="p-4 font-sans text-xs max-w-xs truncate">
                      <code className="text-[11px] text-muted-foreground font-mono">
                        {JSON.stringify(log.metadata)}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-muted/20">
            <p className="text-xs text-muted-foreground font-sans">
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total logs)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
