export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-3 border-b border-border pb-5">
        <div className="h-4 w-24 rounded-md bg-muted" />
        <div className="h-8 w-48 rounded-md bg-muted" />
      </div>
      <div className="grid gap-3">
        <div className="h-16 rounded-md border border-border bg-card" />
        <div className="h-16 rounded-md border border-border bg-card" />
        <div className="h-16 rounded-md border border-border bg-card" />
      </div>
    </div>
  );
}
