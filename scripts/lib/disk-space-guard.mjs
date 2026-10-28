import fs from 'node:fs';

function bytes(value, name) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`INVALID_DISK_BUDGET: ${name}`);
  return n;
}

export function evaluateDiskBudget({ availableBytes, estimatedBytes, reserveBytes, override = false }) {
  const available = bytes(availableBytes, 'availableBytes');
  const estimated = bytes(estimatedBytes, 'estimatedBytes');
  const reserve = bytes(reserveBytes, 'reserveBytes');
  const required = bytes(estimated + reserve, 'requiredBytes');
  if (available < required && !override) {
    throw new Error(`INSUFFICIENT_DISK_SPACE: available=${available}; estimated=${estimated}; reserve=${reserve}; required=${required}. Free space or explicitly use --allow-low-disk-space.`);
  }
  return { availableBytes: available, estimatedBytes: estimated, reserveBytes: reserve, requiredBytes: required, overridden: available < required };
}

export function requireDiskSpace({ directory = process.cwd(), estimatedBytes = 2_000_000_000, label = 'large output' } = {}) {
  const disk = fs.statfsSync(directory, { bigint: true });
  const result = evaluateDiskBudget({
    availableBytes: Number(disk.bavail * disk.bsize),
    estimatedBytes: process.env.PHIOS_DISK_ESTIMATE_BYTES ?? estimatedBytes,
    reserveBytes: process.env.PHIOS_DISK_RESERVE_BYTES ?? 5_000_000_000,
    override: process.argv.includes('--allow-low-disk-space'),
  });
  console.log(`[disk-budget] ${label}: ${JSON.stringify(result)}`);
  return result;
}
