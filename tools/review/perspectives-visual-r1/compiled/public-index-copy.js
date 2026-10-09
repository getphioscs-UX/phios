// assets/js/runtime/web-production/asset-resolver.js
var DEFAULT_REGISTRY_URL = "/content/registry/public-assets.json";
var DEFAULT_CONFIG_URL = "/api/public-asset-config";
var VERIFIED_PATTERN = /^verified(?:$|[-_])/i;
var PublicAssetResolutionError = class extends Error {
  constructor(code, message = code, details = {}) {
    super(message);
    this.name = "PublicAssetResolutionError";
    this.code = code;
    this.details = details;
  }
};
function normalizePublicAssetBaseUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new PublicAssetResolutionError("PUBLIC_ASSET_BASE_URL_INVALID");
  }
  if (url.protocol !== "https:") throw new PublicAssetResolutionError("PUBLIC_ASSET_BASE_URL_INVALID");
  if (url.username || url.password || url.search || url.hash) throw new PublicAssetResolutionError("PUBLIC_ASSET_BASE_URL_INVALID");
  return url.toString().replace(/\/$/, "");
}
function normalizePublicAssetObjectKey(value) {
  const key = String(value ?? "").trim();
  if (!key || key.startsWith("/") || key.includes("\\") || key.includes("?") || key.includes("#")) {
    throw new PublicAssetResolutionError("PUBLIC_ASSET_OBJECT_KEY_INVALID");
  }
  const parts = key.split("/");
  if (parts.some((part) => part === "." || part === "..")) throw new PublicAssetResolutionError("PUBLIC_ASSET_OBJECT_KEY_INVALID");
  return key;
}
function encodedObjectKey(key) {
  const trailingSlash = key.endsWith("/");
  const encoded = key.split("/").filter((part, index, all) => !(trailingSlash && index === all.length - 1)).map(encodeURIComponent).join("/");
  return trailingSlash ? `${encoded}/` : encoded;
}
function isAssetVerificationRenderable(verification) {
  return VERIFIED_PATTERN.test(String(verification ?? ""));
}
function findPublicAsset(registry, assetCode) {
  if (!registry || registry.bucket !== "phios-public-assets" || !Array.isArray(registry.assets)) {
    throw new PublicAssetResolutionError("PUBLIC_ASSET_REGISTRY_INVALID");
  }
  const code = String(assetCode ?? "").trim();
  const asset = registry.assets.find((item) => item.asset_code === code);
  if (!asset) throw new PublicAssetResolutionError("PUBLIC_ASSET_NOT_FOUND", "Public asset is not registered.", { assetCode: code });
  return asset;
}
function chooseVariant(asset, variantCode = "ORIGINAL") {
  const code = String(variantCode || "ORIGINAL").toUpperCase();
  if (code === "ORIGINAL") return { code: "ORIGINAL", object_key: asset.object_key, format: asset.format, verification: asset.verification, width: asset.width ?? null, height: asset.height ?? null };
  const variants = Array.isArray(asset.variants) ? asset.variants : [];
  const variant = variants.find((item) => String(item.code ?? "").toUpperCase() === code);
  if (!variant) throw new PublicAssetResolutionError("PUBLIC_ASSET_VARIANT_NOT_REGISTERED", "Requested asset variant is not registered.", { assetCode: asset.asset_code, variant: code });
  return { ...variant, code };
}
function buildSrcset(baseUrl, asset) {
  const variants = Array.isArray(asset.variants) ? asset.variants : [];
  return variants.filter((item) => item && item.object_key && Number.isFinite(Number(item.width)) && isAssetVerificationRenderable(item.verification ?? asset.verification)).map((item) => `${baseUrl}/${encodedObjectKey(normalizePublicAssetObjectKey(item.object_key))} ${Number(item.width)}w`).join(", ") || null;
}
function resolvePublicAsset({ registry, assetCode, publicBaseUrl, variant = "ORIGINAL", surface = null, locale = null, density = 1 } = {}) {
  const baseUrl = normalizePublicAssetBaseUrl(publicBaseUrl);
  if (!baseUrl) throw new PublicAssetResolutionError("PUBLIC_ASSET_BASE_URL_UNAVAILABLE");
  const asset = findPublicAsset(registry, assetCode);
  const selected = chooseVariant(asset, variant);
  const objectKey = normalizePublicAssetObjectKey(selected.object_key);
  const isGroup = objectKey.endsWith("/");
  if (isGroup) throw new PublicAssetResolutionError("PUBLIC_ASSET_GROUP_REQUIRES_OBJECT_MEMBER", "Asset group cannot be rendered as a concrete object.", { assetCode });
  const verification = selected.verification ?? asset.verification;
  const renderable = isAssetVerificationRenderable(verification);
  const url = `${baseUrl}/${encodedObjectKey(objectKey)}`;
  return {
    assetCode: asset.asset_code,
    category: asset.category,
    family: asset.family ?? null,
    objectKey,
    contentType: asset.content_type ?? null,
    canonicalFormat: asset.format ?? null,
    variant: selected.code,
    surface,
    locale,
    density,
    src: url,
    srcset: buildSrcset(baseUrl, asset),
    sizes: selected.sizes ?? null,
    width: selected.width ?? null,
    height: selected.height ?? null,
    aspectRatio: selected.width && selected.height ? Number(selected.width) / Number(selected.height) : null,
    loading: selected.loading ?? "lazy",
    fetchPriority: selected.fetchPriority ?? "auto",
    renderable,
    deliveryState: renderable ? "VERIFIED_RENDERABLE" : "UPSTREAM_VERIFICATION_REQUIRED",
    verification,
    sourceReference: "content/registry/public-assets.json"
  };
}
async function fetchPublicAssetRegistry({ fetchImpl = fetch, registryUrl = DEFAULT_REGISTRY_URL } = {}) {
  const response = await fetchImpl(registryUrl, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new PublicAssetResolutionError("PUBLIC_ASSET_REGISTRY_INVALID");
  return response.json();
}
async function fetchPublicAssetConfig({ fetchImpl = fetch, configUrl = DEFAULT_CONFIG_URL } = {}) {
  const response = await fetchImpl(configUrl, { headers: { Accept: "application/json" } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success || !payload.publicAssetBaseUrl) throw new PublicAssetResolutionError("PUBLIC_ASSET_BASE_URL_UNAVAILABLE");
  return payload;
}
async function resolvePublicAssetForWeb(assetCode, options = {}) {
  const registry = options.registry ?? await fetchPublicAssetRegistry(options);
  const registryBase = normalizePublicAssetBaseUrl(registry.public_base_url);
  let configBase = null;
  if (!registryBase) {
    const config = options.publicConfig ?? await fetchPublicAssetConfig(options);
    configBase = normalizePublicAssetBaseUrl(config.publicAssetBaseUrl);
  } else if (options.publicConfig?.publicAssetBaseUrl) {
    configBase = normalizePublicAssetBaseUrl(options.publicConfig.publicAssetBaseUrl);
    if (configBase !== registryBase) throw new PublicAssetResolutionError("PUBLIC_ASSET_BASE_URL_CONFLICT");
  }
  return resolvePublicAsset({ registry, assetCode, publicBaseUrl: registryBase ?? configBase, variant: options.variant, surface: options.surface, locale: options.locale, density: options.density });
}

// assets/js/pages/civilization-atlas/atlas-static-visual.js
var ATLAS_VISUAL_BINDINGS_PATH = "/content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json";
var PUBLIC_BASE = "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/";
var FAMILIES = {
  TIMELINE_ANCHOR: ["timeline", "\u65F6\u4EE3\u573A\u666F", "Timeline scenes"],
  CASE_HERO: ["cases", "\u6587\u660E\u6848\u4F8B", "Civilization cases"],
  CASE_SECONDARY: ["cases", "\u6848\u4F8B\u7EC6\u8282", "Case details"],
  WORLD_SNAPSHOT_ATMOSPHERE: ["snapshots", "\u4E16\u754C\u6A2A\u5207\u9762", "World snapshots"],
  COMPARISON_FAMILY: ["comparison", "\u6587\u660E\u6BD4\u8F83", "Civilization comparisons"],
  TRAJECTORY_MOTIF: ["trajectories", "\u957F\u65F6\u6BB5\u8F68\u8FF9", "Long-term trajectories"],
  TRANSITION_WINDOW: ["transitions", "\u8F6C\u578B\u7A97\u53E3", "Transitions"],
  SCALE_SHIFT: ["scale-shifts", "\u5C3A\u5EA6\u53D8\u5316", "Scale shifts"],
  LOSS_FAMILY: ["loss", "\u635F\u5931\u4E0E\u5EF6\u7EED", "Loss and continuity"],
  LOSS_TYPE_VIGNETTE: ["loss", "\u635F\u5931\u7C7B\u578B", "Types of loss"],
  CIVILIZATION_INFRASTRUCTURE: ["infrastructure", "\u6587\u660E\u57FA\u7840\u8BBE\u65BD", "Civilization infrastructure"],
  GEOGRAPHIC_BASE: ["maps", "\u5730\u7406\u80CC\u666F", "Geographic settings"],
  HISTORICAL_FIGURE: ["historical-figures", "\u5386\u53F2\u4EBA\u7269\u5F62\u8C61", "Historical figure illustrations"],
  MODERN_FLAG: ["flags", "\u73B0\u4EE3\u56FD\u5BB6\u65D7\u5E1C", "Modern national flags"],
  WORLD_RECONFIGURATION_SNAPSHOT: ["reconfiguration", "\u7B2C\u516D\u518C\uFF1A\u4E16\u754C\u91CD\u6784", "Book VI: world reconfiguration"]
};
function isLocalAtlasReview(location = globalThis.location) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(location?.hostname);
}
function resolveAtlasVisualById(bindings, assetId, { allowPendingReview = false } = {}) {
  const a = bindings?.assets?.find((a2) => a2.assetId === assetId), folder = FAMILIES[a?.family]?.[0];
  if (!a || !folder || !/^(VIS-CIV-[A-Z0-9_-]+|WORLD_RECONFIGURATION_SNAPSHOT_\d{4})$/.test(a.assetId)) return null;
  const pending = allowPendingReview && bindings.pendingReviewPolicy === "LOCAL_REVIEW_ONLY_UNTIL_EXPLICIT_HUMAN_ACCEPTANCE" && a.reviewState === "PENDING_HUMAN_REVIEW" && a.deliveryVerified === true && a.ownerUploadConfirmed === true;
  if (a.reviewState !== "ACCEPTED" && !pending) return null;
  if (bindings.schemaVersion === "PHI-OS-CIVILIZATION-VISUAL-APPROVED-BINDINGS-v2" && (a.deliveryVerified !== true || a.ownerUploadConfirmed !== true)) return null;
  const boundedText = a.containsText === false || bindings.schemaVersion === "PHI-OS-CIVILIZATION-VISUAL-APPROVED-BINDINGS-v2" && [null, true].includes(a.containsText) && a.embeddedTextAuthority === "NONE" && a.displayTextAuthority === "HTML_REGISTRY_ONLY";
  if (a.bindingState !== "BOUND" || a.fallback !== "STRUCTURED_HTML_SVG" || !boundedText || a.historicalAuthority !== false || a.canonicalAuthority !== false || a.registryWriteAuthority !== false || a.ocrWriteBackAllowed !== false) return null;
  if (!/^[a-f0-9]{64}$/.test(a.sha256 || "") || typeof a.reviewEvidence !== "string" || !a.reviewEvidence.trim()) return null;
  if (a.bucketKey !== `images/civilization-atlas/${folder}/${a.assetId}.webp` || a.publicUrl !== PUBLIC_BASE + a.bucketKey) return null;
  const prefixes = { CIVILIZATION_INFRASTRUCTURE: `VIS-CIV-${a.subjectId}`, GEOGRAPHIC_BASE: `VIS-CIV-${a.subjectId}`, HISTORICAL_FIGURE: `VIS-CIV-${a.subjectId}`, MODERN_FLAG: `VIS-CIV-${a.subjectId}`, WORLD_RECONFIGURATION_SNAPSHOT: a.subjectId, TIMELINE_ANCHOR: `VIS-CIV-${a.subjectId}-HERO`, CASE_HERO: `VIS-CIV-${a.subjectId}-HERO`, CASE_SECONDARY: `VIS-CIV-${a.subjectId}-SECONDARY`, WORLD_SNAPSHOT_ATMOSPHERE: `VIS-CIV-${a.subjectId}-ATMOSPHERE`, COMPARISON_FAMILY: `VIS-CIV-CF-${a.subjectId}`, TRAJECTORY_MOTIF: `VIS-CIV-TRJ-${a.subjectId}`, TRANSITION_WINDOW: `VIS-CIV-${a.subjectId}`, SCALE_SHIFT: `VIS-CIV-${a.subjectId}`, LOSS_FAMILY: `VIS-CIV-LF-${a.subjectId}`, LOSS_TYPE_VIGNETTE: `VIS-CIV-LT-${a.subjectId}` };
  if (prefixes[a.family] && a.assetId !== prefixes[a.family]) return null;
  return a;
}

// assets/js/public-v2/unified-public-visual-resolver.js
var POINTER_URL = "/content/web-production/registries/current-client-visual-registry.json";
var pointerPromise;
var clientRegistryPromise;
var atlasBindingsPromise;
async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`PX2_FETCH_FAILED:${url}`);
  return response.json();
}
async function currentPointer() {
  if (!pointerPromise) pointerPromise = fetchJson(POINTER_URL);
  return pointerPromise;
}
async function clientVisualRegistry() {
  if (!clientRegistryPromise) {
    clientRegistryPromise = currentPointer().then((pointer) => fetchJson(pointer.currentRegistryPath));
  }
  return clientRegistryPromise;
}
function clientEntry(registry, code) {
  return registry.assets?.find((asset) => asset.sequence === code || asset.assetCode === code || asset.legacyAssetCode === code) || null;
}
async function resolveUnifiedPublicVisual(code, options = {}) {
  if (/^(VIS-CIV-[A-Z0-9_-]+|WORLD_RECONFIGURATION_SNAPSHOT_\d{4})$/.test(code)) {
    atlasBindingsPromise ||= fetchJson(ATLAS_VISUAL_BINDINGS_PATH).catch((error) => {
      atlasBindingsPromise = null;
      throw error;
    });
    const registry = await atlasBindingsPromise;
    const entry = resolveAtlasVisualById(registry, code, { allowPendingReview: isLocalAtlasReview() });
    if (!entry) throw Error("UNRESOLVED_ASSET_BINDING");
    return { assetCode: code, src: entry.publicUrl, renderable: true, deliveryState: "VERIFIED_RENDERABLE", reviewState: entry.reviewState, sourceReference: ATLAS_VISUAL_BINDINGS_PATH.slice(1) };
  }
  try {
    return await resolvePublicAssetForWeb(code, options);
  } catch (primaryError) {
    const [clientRegistry, publicRegistry] = await Promise.all([clientVisualRegistry(), fetchPublicAssetRegistry()]);
    const entry = clientEntry(clientRegistry, code);
    if (!entry?.r2?.objectKey || entry.r2.remoteVerified !== true) throw primaryError;
    const config = publicRegistry.public_base_url ? null : await fetchPublicAssetConfig();
    const base = normalizePublicAssetBaseUrl(publicRegistry.public_base_url || config?.publicAssetBaseUrl);
    if (!base) throw primaryError;
    return resolvePublicAsset({
      registry: {
        bucket: "phios-public-assets",
        assets: [{
          asset_code: code,
          category: String(entry.assetType || "visual").toLowerCase(),
          family: entry.family || entry.assetType || null,
          object_key: entry.r2.objectKey,
          format: String(entry.productionSpec?.productionFormat || entry.canonicalFormat || "webp").toLowerCase(),
          content_type: entry.productionSpec?.productionFormat === "SVG" ? "image/svg+xml" : "image/webp",
          verification: "verified-client-visual-registry-v1",
          width: entry.productionSpec?.width || entry.masterSize?.width || null,
          height: entry.productionSpec?.height || entry.masterSize?.height || null
        }]
      },
      assetCode: code,
      publicBaseUrl: base,
      surface: options.surface || null,
      locale: options.locale || null
    });
  }
}
async function hydrateUnifiedPublicVisuals(root = document) {
  const images = [...root.querySelectorAll("img[data-px2-asset]")];
  await Promise.all(images.map(async (image) => {
    const holder = image.closest("[data-px2-visual]") || image;
    try {
      const asset = await resolveUnifiedPublicVisual(image.dataset.px2Asset, { surface: image.dataset.px2Surface || document.body.dataset.px2Surface || "PUBLIC_V2" });
      if (!asset?.renderable) throw new Error("PX2_ASSET_NOT_RENDERABLE");
      image.src = asset.src;
      if (asset.srcset) image.srcset = asset.srcset;
      if (asset.sizes) image.sizes = asset.sizes;
      if (asset.width) image.width = asset.width;
      if (asset.height) image.height = asset.height;
      holder.dataset.assetStatus = "ready";
    } catch {
      holder.dataset.assetStatus = "unavailable";
    }
  }));
}

// assets/customer-ui/js/public-index-copy.js
function apply() {
  const zh = document.documentElement.lang.toLowerCase().startsWith("zh");
  document.querySelectorAll("[data-pis-copy]").forEach((node) => {
    node.textContent = node.getAttribute(zh ? "data-cx-zh" : "data-cx-en") || "";
  });
  document.querySelectorAll("[data-pis-aria]").forEach((node) => {
    node.setAttribute("aria-label", node.getAttribute(zh ? "data-cx-zh-aria-label" : "data-cx-en-aria-label"));
  });
  document.querySelectorAll("[data-pis-locale]").forEach((node) => {
    node.hidden = node.dataset.pisLocale !== (zh ? "zh-Hans" : "en");
  });
}
apply();
new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
var heroCode = document.body.dataset.pisHero;
if (heroCode) {
  const heading = document.querySelector("main h1");
  const target = heading?.parentElement;
  if (target && !target.querySelector("form")) {
    target.classList.add("pis-landing-hero");
    const image = document.createElement("img");
    image.dataset.px2Asset = heroCode;
    image.className = "pis-landing-hero__image";
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.loading = "eager";
    image.fetchPriority = "high";
    target.prepend(image);
    const section = target.closest("section");
    section?.querySelectorAll(".cx-knowledge-hero__visual,.cx-explore-hero__visual").forEach((node) => {
      node.hidden = true;
    });
  }
}
hydrateUnifiedPublicVisuals(document).catch(() => {
});
