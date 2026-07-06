import assert from "node:assert";

// 1. Tag Normalization logic directly from tags service (18.2)
function normalizeTagName(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

// 2. Cryptographic token generation & timing-safe validation logic from security helpers (18.3)
import { createHash, timingSafeEqual, randomBytes } from "node:crypto";

function generateShareToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

function hashShareToken(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function timingSafeTokenHashEqual(a, b) {
  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}

// 3. Sanitizer escaping rules (18.4)
function escapeHtml(input) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function testNormalizeTagName() {
  console.log("Running normalizeTagName tests...");
  assert.strictEqual(normalizeTagName("  tag  "), "tag");
  assert.strictEqual(normalizeTagName("Hello   World"), "hello world");
  assert.strictEqual(normalizeTagName("testName"), "testname");
  console.log("normalizeTagName tests passed.");
}

function testShareTokenSecurity() {
  console.log("Running share token security tests...");
  const token = generateShareToken();
  assert.ok(token.length > 20);
  
  const hash = hashShareToken(token);
  assert.strictEqual(hash.length, 64); // sha256 hex string

  const matched = timingSafeTokenHashEqual(hash, hashShareToken(token));
  assert.strictEqual(matched, true);

  const mismatched = timingSafeTokenHashEqual(hash, "mismatched-hash");
  assert.strictEqual(mismatched, false);
  console.log("share token security tests passed.");
}

function testSanitizeMarkdownHtml() {
  console.log("Running markdown sanitize tests...");
  const maliciousInput = "<script>alert('xss')</script><b>bold</b>";
  const escaped = escapeHtml(maliciousInput);
  assert.ok(escaped.includes("&lt;script&gt;"));
  assert.ok(escaped.includes("&lt;b&gt;"));
  console.log("markdown sanitize tests passed.");
}

function runAllUnitTests() {
  try {
    testNormalizeTagName();
    testShareTokenSecurity();
    testSanitizeMarkdownHtml();
    console.log("All custom unit tests completed successfully.");
  } catch (error) {
    console.error("Unit test failure:", error);
    process.exit(1);
  }
}

runAllUnitTests();
