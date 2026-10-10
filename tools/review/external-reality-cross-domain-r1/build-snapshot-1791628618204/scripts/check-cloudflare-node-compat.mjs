import fs from 'node:fs';

const configPath = new URL('../wrangler.jsonc', import.meta.url);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const flags = Array.isArray(config.compatibility_flags) ? config.compatibility_flags : [];
const required = 'nodejs_compat';
if (!flags.includes(required)) {
  console.error(`✗ Cloudflare Node compatibility missing: expected compatibility_flags to include ${required}`);
  process.exit(1);
}
if (config.compatibility_date !== '2026-07-14') {
  console.error(`✗ Unexpected compatibility_date drift: ${config.compatibility_date}`);
  process.exit(1);
}
console.log('✓ Cloudflare Pages Functions Node compatibility gate passed.');
console.log('  compatibility_date remains 2026-07-14.');
console.log('  nodejs_compat is explicitly enabled for node:fs/path/url/crypto imports.');
