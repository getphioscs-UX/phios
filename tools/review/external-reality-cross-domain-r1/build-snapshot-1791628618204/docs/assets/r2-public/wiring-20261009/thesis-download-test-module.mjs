// content/registry/thesis.json
var thesis_default = {
  registry_version: "1.0.0",
  thesis_id: "reality-navigation-thesis",
  title: "Reality Navigation Thesis",
  status: "completed-source-registered-version-pending",
  version: null,
  authority: [
    "reality-navigation-category",
    "unified-runtime-framework",
    "research-to-infrastructure-bridge"
  ],
  architecture_chain: [
    "reality-navigation-thesis",
    "phios-knowledge-system",
    "runtime-blueprint",
    "reality-navigation-platform"
  ],
  source_file: "PHI OS Reality Navigation Thesis.pdf",
  source_size_bytes: 15994918,
  source_identity_status: "canonical-clean-filename-selected-among-equal-size-duplicates",
  web_route: "/thesis",
  freeze_blocker: "\u6B63\u5F0F PDF \u5DF2\u767B\u8BB0\uFF1B\u4ECD\u987B\u786E\u5B9A\u7248\u672C\u53F7\u5E76\u5EFA\u7ACB changelog \u540E\u624D\u80FD\u6807\u8BB0 stable\u3002",
  current_public_delivery: {
    object_key: "downloads/thesis/reality-navigation-thesis.pdf",
    public_url: "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/downloads/thesis/reality-navigation-thesis.pdf",
    size_bytes: 3044299,
    sha256: "59452e4a00b853cee8260f500e3c758ca3b01ecec23589c586dbcb854c455c09",
    page_count: 104,
    owner_confirmation: {
      date: "2026-10-09",
      instruction: "Thesis \u7684 R2 \u6587\u4EF6\u7EA6 3 MB \u662F\u6B63\u786E\u7684\u7248\u672C",
      scope: "Existing R2 PDF is the correct current public delivery; no new numbered stable release inferred."
    },
    verification_evidence: "docs/assets/r2-public/wiring-20261009/THESIS-PDF.json",
    historical_source_registration_preserved: true
  }
};

// functions/api/thesis-download.js
async function onRequestGet({ request } = {}) {
  const delivery = thesis_default.current_public_delivery;
  if (!delivery?.owner_confirmation || delivery.object_key !== "downloads/thesis/reality-navigation-thesis.pdf") return new Response("Thesis delivery unavailable", { status: 503 });
  const upstream = await fetch(delivery.public_url);
  if (!upstream.ok || !upstream.headers.get("content-type")?.includes("application/pdf")) return new Response("Thesis PDF unavailable", { status: 502 });
  const bytes = await upstream.arrayBuffer();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
  if (bytes.byteLength !== delivery.size_bytes || digest !== delivery.sha256) return new Response("Thesis version requires review", { status: 502 });
  const disposition = request && new URL(request.url).searchParams.get("view") === "inline" ? "inline" : "attachment";
  return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": disposition + '; filename="reality-navigation-thesis.pdf"', "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "frame-ancestors 'self'; base-uri 'none'" } });
}
export {
  onRequestGet
};
