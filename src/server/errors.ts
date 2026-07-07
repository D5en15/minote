export class QuotaExceededError extends Error {
  details: Record<string, unknown>;

  constructor(details: Record<string, unknown>) {
    super("QUOTA_EXCEEDED");
    this.name = "QuotaExceededError";
    this.details = details;
  }
}
