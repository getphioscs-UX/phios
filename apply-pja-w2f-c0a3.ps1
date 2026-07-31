param(
  [string]$RepositoryRoot = "."
)

$ErrorActionPreference = "Stop"

$path = Join-Path $RepositoryRoot "scripts/check-pja-w2b-structured-article-schema.mjs"
if (-not (Test-Path $path)) {
  throw "Missing required file: scripts/check-pja-w2b-structured-article-schema.mjs"
}

$content = Get-Content -Raw -Encoding UTF8 $path

$oldResult = @'
  schema,
  nodesRegistry,
'@
$newResult = @'
  schema,
  blueprint,
  nodesRegistry,
'@
if (-not $content.Contains($oldResult)) {
  throw "Expected Promise result baseline was not found."
}
$content = $content.Replace($oldResult, $newResult)

$oldInput = @'
  readJson(schemaPath),
  readJson('content/knowledge/registry/nodes.json'),
'@
$newInput = @'
  readJson(schemaPath),
  readJson('content/knowledge/blueprints/book-1-knowledge-blueprint.json'),
  readJson('content/knowledge/registry/nodes.json'),
'@
if (-not $content.Contains($oldInput)) {
  throw "Expected Promise input baseline was not found."
}
$content = $content.Replace($oldInput, $newInput)

$oldCounts = @'
assert.equal(nodesRegistry.nodes.length, 13);
assert.equal(themesRegistry.themes.length, 6);
'@
$newCounts = @'
assert.equal(nodesRegistry.nodes.length, blueprint.plannedCanonicalNodes);
assert.equal(
  nodesRegistry.nodes.filter(node => node.nodeCode.startsWith('KN-PREFACE-')).length,
  blueprint.prefaceCanonicalNodes
);
assert.equal(
  themesRegistry.themes.filter(theme => theme.themeCode.startsWith('TH-PREFACE-')).length,
  6
);
assert.equal(themesRegistry.themes.length, 6 + blueprint.sourceParts);
'@
if (-not $content.Contains($oldCounts)) {
  throw "Expected Registry count baseline was not found."
}
$content = $content.Replace($oldCounts, $newCounts)

Set-Content -Encoding UTF8 -NoNewline -Path $path -Value $content

Write-Host "Updated scripts/check-pja-w2b-structured-article-schema.mjs"
Write-Host ""
Write-Host "Next run:"
Write-Host "  npm run check:pja-w2b"
Write-Host "  npm run check:pja-w2f-c0"
Write-Host "  npm run check"
