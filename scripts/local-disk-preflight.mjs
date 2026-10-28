import { requireDiskSpace } from './lib/disk-space-guard.mjs';
const arg = name => process.argv.find(x => x.startsWith(`${name}=`))?.slice(name.length + 1);
requireDiskSpace({label:arg('--operation') ?? 'local checkout/copy',estimatedBytes:Number(arg('--estimated-bytes') ?? 2_000_000_000)});
