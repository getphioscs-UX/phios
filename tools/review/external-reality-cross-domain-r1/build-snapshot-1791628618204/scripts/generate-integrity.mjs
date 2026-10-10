import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryRoot = path.join(root, "content/registry");
const excluded = new Set(["integrity.json"]);
const files = fs.readdirSync(registryRoot)
  .filter((name) => name.endsWith(".json") && !excluded.has(name))
  .sort();
const entries = files.map((name) => {
  const bytes = fs.readFileSync(path.join(registryRoot, name));
  return {file:name,sha256:crypto.createHash("sha256").update(bytes).digest("hex"),bytes:bytes.length};
});
const output = {algorithm:"sha256",generated_at:"2026-07-22",scope:"content/registry/*.json",entries};
fs.writeFileSync(path.join(registryRoot, "integrity.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated integrity for ${entries.length} registry files.`);

