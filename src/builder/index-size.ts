export const INDEX_SIZE_WARN_BYTES = 2 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit++;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(1)} ${units[unit]}`;
}

export function isIndexSizeWarning(bytes: number): boolean {
  return bytes >= INDEX_SIZE_WARN_BYTES;
}
