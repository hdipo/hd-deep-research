export const APP_VERSION = '1.0.0';
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
