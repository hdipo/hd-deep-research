export const APP_VERSION = (
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_APP_VERSION ||
  '1.1.0'
).trim();
export const DEFAULT_GITHUB_REPO_URL = 'https://github.com/hdipo/hd-deep-research';
export const DEFAULT_SHARED_BACKEND_URL =
  'https://ais-pre-2k7kerau3t33iwfz2q7qjf-273113077839.asia-northeast1.run.app';

export interface FeaturedTopic {
  category: string;
  title: string;
  query: string;
}

export interface RemoteAppConfig {
  latestAppVersion?: string;
  minRequiredVersion?: string;
  forceUpdate?: boolean;
  updateNotes?: string;
  apiBaseUrl?: string;
  announcement?: string;
  featuredTopics?: FeaturedTopic[];
}

export function normalizeVersion(tag: string): number[] {
  const cleaned = tag.trim().replace(/^v/i, '').split('-')[0];
  return cleaned.split('.').map((n) => {
    const parsed = Number.parseInt(n, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  });
}

export function formatVersionTag(tag: string): string {
  const clean = tag.trim().replace(/^v/i, '');
  return clean ? `v${clean}` : '';
}

export function isNewerReleaseTag(remoteTag: string, currentVersion = APP_VERSION): boolean {
  if (!remoteTag) return false;
  const a = normalizeVersion(remoteTag);
  const b = normalizeVersion(currentVersion);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    if (va > vb) return true;
    if (va < vb) return false;
  }
  return false;
}

export function pickHigherVersion(versionA?: string, versionB?: string): string {
  const a = (versionA || '').trim();
  const b = (versionB || '').trim();
  if (!a) return b;
  if (!b) return a;
  return isNewerReleaseTag(b, a) ? b : a;
}

export function isMajorOrMinorBump(remoteTag: string, currentVersion = APP_VERSION): boolean {
  if (!remoteTag || !isNewerReleaseTag(remoteTag, currentVersion)) return false;
  const [rMajor = 0, rMinor = 0] = normalizeVersion(remoteTag);
  const [cMajor = 0, cMinor = 0] = normalizeVersion(currentVersion);
  return rMajor > cMajor || (rMajor === cMajor && rMinor > cMinor);
}

export function isMandatoryApkUpdate(
  latestTag: string,
  currentVersion: string,
  remoteConfig: RemoteAppConfig | null
): boolean {
  if (!latestTag || !isNewerReleaseTag(latestTag, currentVersion)) return false;
  if (remoteConfig?.forceUpdate === true) return true;
  if (
    remoteConfig?.minRequiredVersion &&
    isNewerReleaseTag(remoteConfig.minRequiredVersion, currentVersion)
  ) {
    return true;
  }
  return isMajorOrMinorBump(latestTag, currentVersion);
}
