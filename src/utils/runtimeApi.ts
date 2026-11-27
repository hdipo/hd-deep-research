import { DEFAULT_SHARED_BACKEND_URL, RemoteAppConfig } from '../config/appConfig';

export function isBundledNativeApk(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (w.Capacitor?.isNativePlatform?.()) return true;
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:') {
    return true;
  }
  if (window.location.hostname === 'localhost' && window.location.port === '') {
    return true;
  }
  return false;
}

export function resolveBackendApiBase(remoteApiBaseUrl?: string): string {
  if (!isBundledNativeApk()) {
    return '';
  }
  const clean = (remoteApiBaseUrl || DEFAULT_SHARED_BACKEND_URL).trim().replace(/\/+$/, '');
  return clean;
}

function decodeBase64Utf8(b64: string): string {
  const clean = b64.replace(/\n/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

const GH_HEADERS = {
  Accept: 'application/vnd.github+json',
};

export interface AppUpdateSyncResponse {
  latestCommitSha: string;
  latestCommitMessage: string;
  latestCommitDate: string;
  hasWorkflow: boolean;
  hasCapacitorConfig: boolean;
  hasSharedData: boolean;
  latestReleaseTag: string;
  latestReleaseUrl: string;
  releaseNotes?: string;
  apkDownloadUrl: string;
  apkFileName: string;
  apkSize: number;
  remoteConfig: RemoteAppConfig | null;
  syncedAt: string;
}

export async function fetchAppUpdateSync(
  owner: string,
  repo: string,
  branch: string
): Promise<AppUpdateSyncResponse | null> {
  if (!isBundledNativeApk()) {
    const res = await fetch(
      `/api/github/sync?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(
        repo
      )}&branch=${encodeURIComponent(branch)}`
    );
    if (!res.ok) return null;
    return (await res.json()) as AppUpdateSyncResponse;
  }

  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const [releaseRes, cfgRes] = await Promise.allSettled([
    fetch(`${base}/releases/latest`, { headers: GH_HEADERS, cache: 'no-store' }),
    fetch(`${base}/contents/data/app-config.json?ref=${encodeURIComponent(branch)}`, {
      headers: GH_HEADERS,
      cache: 'no-store',
    }),
  ]);

  let latestReleaseTag = '';
  let latestReleaseUrl = '';
  let releaseNotes = '';
  let apkDownloadUrl = '';
  let apkFileName = '';
  let apkSize = 0;
  if (releaseRes.status === 'fulfilled' && releaseRes.value.ok) {
    const rData = await releaseRes.value.json();
    latestReleaseTag = rData.tag_name || '';
    latestReleaseUrl = rData.html_url || '';
    releaseNotes = typeof rData.body === 'string' ? rData.body.trim() : '';
    const apkAsset = (rData.assets || []).find((a: { name?: string }) =>
      (a.name || '').toLowerCase().endsWith('.apk')
    );
    if (apkAsset?.browser_download_url) {
      apkDownloadUrl = apkAsset.browser_download_url;
      apkFileName = apkAsset.name || 'HD-Deep-Research.apk';
      apkSize = apkAsset.size || 0;
    }
  }

  let remoteConfig: RemoteAppConfig | null = null;
  if (cfgRes.status === 'fulfilled' && cfgRes.value.ok) {
    const cJson = await cfgRes.value.json();
    if (cJson.content && cJson.encoding === 'base64') {
      try {
        remoteConfig = JSON.parse(decodeBase64Utf8(cJson.content)) as RemoteAppConfig;
      } catch {
        remoteConfig = null;
      }
    }
  }

  return {
    latestCommitSha: '',
    latestCommitMessage: '',
    latestCommitDate: '',
    hasWorkflow: true,
    hasCapacitorConfig: true,
    hasSharedData: false,
    latestReleaseTag,
    latestReleaseUrl,
    releaseNotes,
    apkDownloadUrl,
    apkFileName,
    apkSize,
    remoteConfig,
    syncedAt: new Date().toISOString(),
  };
}
