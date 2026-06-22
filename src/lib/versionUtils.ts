/** Returns positive if a > b, negative if a < b, 0 if equal. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** True if releaseVersion is strictly newer than appVersion. */
export function isNewerVersion(releaseVersion: string, appVersion: string): boolean {
  return compareVersions(releaseVersion, appVersion) > 0;
}
