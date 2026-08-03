param(
  [string]$SourceRoot = $PSScriptRoot
)

$ErrorActionPreference = "Stop"
$repoRoot = (Get-Location).Path

$expected = @(
  "content\professional\method-audits\hdr-w0-scope.json",
  "content\professional\method-audits\hdr-w0-current-source.json",
  "content\professional\method-audits\hdr-w0-calculation-layers.json",
  "content\professional\method-audits\hdr-w0-data-rights.json",
  "content\professional\method-audits\hdr-w0-ai-boundary.json",
  "content\professional\method-audits\hdr-w0-decision-queue.json",
  "content\professional\method-audits\hdr-w0-validation-plan.json",
  "content\professional\method-audits\hdr-w0-legacy-material-assessment.json",
  "docs\hdr\HDR-W0-HUMAN-DESIGN-RUNTIME-FOUNDATION-AUDIT.md",
  "scripts\check-hdr-w0-human-design-runtime-foundation.mjs"
)

foreach ($relative in $expected) {
  $source = [System.IO.Path]::GetFullPath((Join-Path $SourceRoot $relative))
  if (-not (Test-Path $source)) {
    throw "Missing package file: $relative"
  }

  $target = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $relative))
  $targetDir = Split-Path -Parent $target
  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

  if ([string]::Equals($source, $target, [System.StringComparison]::OrdinalIgnoreCase)) {
    Write-Host "Already in repository: $relative"
  }
  else {
    Copy-Item -Force $source $target
    Write-Host "Copied: $relative"
  }
}

$packagePath = Join-Path $repoRoot "package.json"
if (-not (Test-Path $packagePath)) {
  throw "package.json not found. Run from the PHI OS repository root."
}

$patchScript = @'
const fs = require("fs");
const path = "package.json";
const command = "node scripts/check-hdr-w0-human-design-runtime-foundation.mjs";
const source = fs.readFileSync(path, "utf8");
const packageJson = JSON.parse(source);
packageJson.scripts ||= {};

const current = packageJson.scripts["check:hdr-w0"];
if (current && current !== command) {
  throw new Error(`Existing check:hdr-w0 conflicts: ${current}`);
}
if (current === command) {
  console.log("package.json already contains check:hdr-w0");
  process.exit(0);
}

const scriptsStart = source.indexOf('"scripts"');
if (scriptsStart < 0) throw new Error("scripts object not found");
const braceStart = source.indexOf("{", scriptsStart);
if (braceStart < 0) throw new Error("scripts opening brace not found");

let depth = 0;
let inString = false;
let escaped = false;
let braceEnd = -1;

for (let i = braceStart; i < source.length; i++) {
  const ch = source[i];
  if (inString) {
    if (escaped) escaped = false;
    else if (ch === "\\") escaped = true;
    else if (ch === '"') inString = false;
    continue;
  }
  if (ch === '"') {
    inString = true;
    continue;
  }
  if (ch === "{") depth++;
  if (ch === "}") {
    depth--;
    if (depth === 0) {
      braceEnd = i;
      break;
    }
  }
}
if (braceEnd < 0) throw new Error("scripts closing brace not found");

const body = source.slice(braceStart + 1, braceEnd);
const newline = source.includes("\r\n") ? "\r\n" : "\n";
const indentMatch = body.match(/\r?\n([ \t]+)"/);
const indent = indentMatch ? indentMatch[1] : "    ";
const trimmed = body.replace(/\s+$/, "");
const hasEntries = /"[^"]+"\s*:/.test(trimmed);
const insertion =
  (hasEntries ? "," : "") +
  newline +
  indent +
  '"check:hdr-w0": "node scripts/check-hdr-w0-human-design-runtime-foundation.mjs"' +
  newline +
  indent.slice(0, Math.max(0, indent.length - 2));

const updated = source.slice(0, braceStart + 1) + trimmed + insertion + source.slice(braceEnd);
JSON.parse(updated);
fs.writeFileSync(path, updated, "utf8");
console.log("Added check:hdr-w0 to package.json");
'@

$tempPatch = Join-Path $env:TEMP "phios-apply-hdr-w0-package-patch.cjs"
[System.IO.File]::WriteAllText(
  $tempPatch,
  $patchScript,
  [System.Text.UTF8Encoding]::new($false)
)

try {
  node $tempPatch
  if ($LASTEXITCODE -ne 0) {
    throw "package.json patch failed."
  }
}
finally {
  Remove-Item $tempPatch -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Next run:"
Write-Host "  npm run check:hdr-w0"
Write-Host "  npm run check:pws-i2-w4"
Write-Host "  npm run check:imr-w0"
Write-Host "  npm run check:pja"
Write-Host "  npm run check:knowledge-runtime"
Write-Host "  npm run check"
Write-Host ""
Write-Host "Delete this installer before commit:"
Write-Host "  Remove-Item .\apply-hdr-w0.ps1"
