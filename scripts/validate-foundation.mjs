import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const fail = (message) => { throw new Error(message); };
const unique = (items, label) => {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item)) fail(`Duplicate ${label}: ${item}`);
    seen.add(item);
  }
};

const manifest = read("content/registry/book-1-manifest.json");
const concepts = read("content/registry/concepts.json");
const synonyms = read("content/registry/synonym-policy.json");
const figures = read("content/registry/figures.json");
const metadata = read("content/registry/research-metadata.json");
const journeys = read("content/registry/journeys.json");
const timeline = read("content/registry/timeline.json");
const books = read("content/registry/books.json");
const parts = read("content/registry/parts.json");
const thesis = read("content/registry/thesis.json");
const blueprints = read("content/registry/blueprints.json");
const platforms = read("content/registry/platforms.json");
const sources = read("content/registry/sources.json");
const registryIndex = read("content/registry/index.json");
const book2Manifest = read("content/registry/book-2-manifest.json");
const book3Manifest = read("content/registry/book-3-manifest.json");
const m0Validation = read("content/registry/m0-validation.json");
const freezeStatus = read("content/registry/freeze-status.json");
const integrity = read("content/registry/integrity.json");

unique(concepts.concepts.map((item) => item.id), "concept id");
unique(figures.figures.map((item) => item.figure_id), "figure id");
unique(figures.figures.map((item) => item.figure_number), "figure number");
unique(journeys.journeys.map((item) => item.id), "journey id");
unique(books.books.map((item) => item.book_id), "book id");
unique(parts.parts.map((item) => item.part_id), "part id");
unique(parts.parts.map((item) => item.number), "part number");
unique(sources.sources.map((item) => item.source_id), "source id");

const conceptIds = new Set(concepts.concepts.map((item) => item.id));
const figureIds = new Set(figures.figures.map((item) => item.figure_id));
for (const part of manifest.parts) {
  for (const id of part.primary_concepts) if (!conceptIds.has(id)) fail(`Unknown concept ${id} in ${part.id}`);
  for (const id of part.figures) if (!figureIds.has(id)) fail(`Unknown figure ${id} in ${part.id}`);
}
for (const policy of synonyms.policies) if (!conceptIds.has(policy.concept)) fail(`Synonym policy references unknown concept ${policy.concept}`);
if (manifest.figure_count !== figures.figures.length) fail("Manifest and Figure Registry counts differ");
if (manifest.page_count !== metadata.active_sources[0].pages) fail("Manifest and research metadata page counts differ");
if (manifest.grammar.stages.length !== 16) fail("Reality Grammar must contain G1-G16");
manifest.grammar.stages.forEach((stage, index) => {
  if (stage.code !== `G${index + 1}`) fail(`Grammar order error at ${stage.code}`);
  if (!conceptIds.has(stage.concept)) fail(`Grammar stage references unknown concept ${stage.concept}`);
});
if (!timeline.events.some((event) => event.type === "content-freeze")) fail("Timeline lacks content freeze");
if (books.books.length !== 3) fail("Research Registry must contain three books");
if (parts.parts.length !== 14) fail("Research Registry must contain Part 1-14");
parts.parts.forEach((part, index) => {
  if (part.number !== index + 1) fail(`Part order error at ${part.part_id}`);
  const owner = books.books.find((book) => book.book_id === part.book);
  if (!owner || !owner.parts.includes(part.number)) fail(`Book ownership mismatch for ${part.part_id}`);
});
if (parts.part_0.book !== "cross-volume") fail("Part 0 must remain cross-volume");
const figure0A = figures.figures.find((figure) => figure.figure_number === "0A");
if (!figure0A || figure0A.scope !== "cross-volume-core") fail("Figure 0A must remain cross-volume-core");
if (thesis.status === "stable" && !thesis.source_file) fail("Stable Thesis requires a registered source file");
if (!blueprints.blueprints.some((item) => item.current_version === "4.0")) fail("Blueprint v4.0 is not registered");
if (!platforms.platforms.some((item) => item.platform_id === "reality-navigation-platform")) fail("Platform registry is missing");
if (registryIndex.status !== "m0-w5-complete") fail("M0-W5 Registry index is not complete");
if (book2Manifest.content_status !== "architecture-only" || book3Manifest.content_status !== "architecture-only") fail("Unfinished books must remain architecture-only");
for (const relative of Object.values(registryIndex.registries)) {
  const absolute = path.resolve(root, "content/registry", relative);
  if (!fs.existsSync(absolute)) fail(`Registry index target is missing: ${relative}`);
}
for (const entry of integrity.entries) {
  const bytes = fs.readFileSync(path.join(root, "content/registry", entry.file));
  const actual = (await import("node:crypto")).default.createHash("sha256").update(bytes).digest("hex");
  if (actual !== entry.sha256) fail(`Integrity mismatch: ${entry.file}`);
}
if (m0Validation.result !== "conditional-pass") fail("Unexpected M0 validation result");
if (freezeStatus.current_state !== "conditional-pass-not-frozen") fail("M0 must not be marked frozen while blockers remain");

for (const figure of figures.figures) {
  const folder = path.join(root, "assets/images/figures", `book-${figure.book}`);
  if (!fs.existsSync(folder)) fail(`Missing figure asset folder: ${folder}`);
}

console.log(JSON.stringify({
  status: "passed",
  book: manifest.book_id,
  parts: manifest.parts.length,
  grammar_stages: manifest.grammar.stages.length,
  concepts: concepts.concepts.length,
  figures: figures.figures.length,
  books: books.books.length,
  numbered_parts: parts.parts.length,
  journeys: journeys.journeys.length,
  research_events: timeline.events.length,
  m0_w5: "complete",
  m0_w6_validation: "conditional-pass",
  m0_total_freeze: "blocked-by-unfrozen-sources"
}, null, 2));
