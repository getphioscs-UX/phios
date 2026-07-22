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

const manifest = read("data/book-manifest.json");
const concepts = read("data/concepts.json");
const synonyms = read("data/synonym-policy.json");
const figures = read("data/figure-registry.json");
const metadata = read("data/research/metadata.json");
const journeys = read("data/research/journeys.json");
const timeline = read("data/research/timeline.json");

unique(concepts.concepts.map((item) => item.id), "concept id");
unique(figures.figures.map((item) => item.figure_id), "figure id");
unique(figures.figures.map((item) => item.figure_number), "figure number");
unique(journeys.journeys.map((item) => item.id), "journey id");

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
  journeys: journeys.journeys.length,
  research_events: timeline.events.length
}, null, 2));

