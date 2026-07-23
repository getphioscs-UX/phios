import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseline = "96f98c1";
const pages = [
  "index.html",
  "about.html",
  "explore.html",
  "reality-entry.html",
  "reality-reading.html",
  "reality-navigation.html"
];
const stylesheet = "/assets/css/design/visual-acceptance.css";
const fail = (message) => { throw new Error(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const baselineFile = (relative) =>
  execFileSync("git", ["show", `${baseline}:${relative}`], {
    cwd: root,
    encoding: "utf8"
  });
const values = (source, expression) =>
  [...source.matchAll(expression)].map((match) => match[1]).sort();

for (const page of pages) {
  const current = read(page);
  const original = baselineFile(page);
  if (!current.includes(stylesheet)) fail(`${page} does not load ${stylesheet}`);

  const currentIds = values(current, /\bid=["']([^"']+)["']/g);
  const originalIds = values(original, /\bid=["']([^"']+)["']/g);
  if (JSON.stringify(currentIds) !== JSON.stringify(originalIds)) {
    fail(`${page} changed an element id`);
  }

  const currentKeys = values(current, /\bdata-i18n=["']([^"']+)["']/g);
  const originalKeys = values(original, /\bdata-i18n=["']([^"']+)["']/g);
  if (JSON.stringify(currentKeys) !== JSON.stringify(originalKeys)) {
    fail(`${page} changed a translation key`);
  }
}

const css = read("assets/css/design/visual-acceptance.css");
const required = [
  [".skip-link", "legacy skip-link compatibility"],
  ["pointer-events: none", "hidden skip-link pointer state"],
  [".skip-link:focus-visible", "keyboard focus reveal"],
  ["grid-template-columns: repeat(5", "five-stage Entry progress"],
  [".runtime-workspace-sidebar", "Runtime sidebar contrast"],
  ["min-height: 44px", "minimum touch target"]
];
for (const [needle, label] of required) {
  if (!css.includes(needle)) fail(`Missing ${label}`);
}

const changed = execFileSync("git", ["diff", "--name-only", baseline], {
  cwd: root,
  encoding: "utf8"
}).trim().split("\n").filter(Boolean);
const forbidden = changed.filter((file) =>
  file.startsWith("assets/js/") ||
  file.startsWith("functions/") ||
  file.startsWith("migrations/") ||
  file === "package.json"
);
if (forbidden.length) fail(`Runtime boundary changed: ${forbidden.join(", ")}`);

console.log("✓ M3A-W1 Production visual acceptance fixes passed.");
console.log(`  Baseline: ${baseline}`);
console.log(`  Pages: ${pages.length}`);
console.log("  Runtime IDs, translation keys, JavaScript, APIs, storage, and state remain unchanged.");
