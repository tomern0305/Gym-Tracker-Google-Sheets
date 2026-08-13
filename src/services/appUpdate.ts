declare const __BUILD_VERSION__: string;

/**
 * GitHub Pages serves index.html with `cache-control: max-age=600` and gives us
 * no way to override headers, so an installed PWA can keep launching a cached
 * build indefinitely — the icon is only a bookmark, and deleting it does not
 * clear the stored page. This asks the server which build is current and, if we
 * are running an older one, reloads through a URL the HTTP cache has never seen.
 */

const RELOAD_GUARD_KEY = 'sessions_update_reload';
const MIN_CHECK_INTERVAL_MS = 60_000;

let lastCheckedAt = 0;

async function fetchDeployedVersion(): Promise<string | null> {
  const url = new URL('version.json', document.baseURI);
  // no-store covers the browser cache; the timestamp covers anything between us
  // and the origin that ignores it.
  url.searchParams.set('t', Date.now().toString());

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) return null;

  const payload = await response.json();
  return typeof payload?.version === 'string' ? payload.version : null;
}

export async function checkForUpdate(): Promise<void> {
  if (import.meta.env.DEV) return;

  const now = Date.now();
  if (now - lastCheckedAt < MIN_CHECK_INTERVAL_MS) return;
  lastCheckedAt = now;

  try {
    const deployed = await fetchDeployedVersion();
    if (!deployed || deployed === __BUILD_VERSION__) {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
      return;
    }

    // Reload at most once per deployed version. If the reload somehow comes
    // back stale anyway, the app keeps working instead of looping forever.
    if (sessionStorage.getItem(RELOAD_GUARD_KEY) === deployed) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, deployed);

    const next = new URL(window.location.href);
    next.searchParams.set('v', deployed);
    window.location.replace(next.toString());
  } catch {
    // Offline, or the request was blocked: keep running what we have.
  }
}

/**
 * Checks on launch and whenever the app is brought back to the foreground,
 * which is when an installed PWA would otherwise sit on a stale build for days.
 */
export function startUpdateWatcher(): () => void {
  void checkForUpdate();

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') void checkForUpdate();
  };

  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}
