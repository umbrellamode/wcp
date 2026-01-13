import { join } from "@std/path";
import { ensureDir, exists } from "@std/fs";
import { bold, box, cyan, dim, yellow } from "../cli/output.ts";
import { getWcpDir } from "./socket.ts";

const CACHE_FILE = "update-check.json";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REPO = "umbrellamode/wcp";

interface UpdateCache {
  lastCheck: number;
  latestVersion: string;
}

/** Get the cache file path (~/.wcp/update-check.json) */
export function getCachePath(): string {
  return join(getWcpDir(), CACHE_FILE);
}

/** Read the update cache file */
async function readCache(): Promise<UpdateCache | null> {
  const cachePath = getCachePath();
  if (!(await exists(cachePath))) {
    return null;
  }
  try {
    const content = await Deno.readTextFile(cachePath);
    return JSON.parse(content) as UpdateCache;
  } catch {
    return null;
  }
}

/** Write the update cache file */
async function writeCache(cache: UpdateCache): Promise<void> {
  await ensureDir(getWcpDir());
  await Deno.writeTextFile(getCachePath(), JSON.stringify(cache, null, 2));
}

/** Clear the update cache (call after successful update) */
export async function clearUpdateCache(): Promise<void> {
  try {
    await Deno.remove(getCachePath());
  } catch {
    // Cache file may not exist
  }
}

/**
 * Compare two semver versions.
 * Returns true if latest > current.
 */
export function compareVersions(current: string, latest: string): boolean {
  // Strip leading 'v' if present
  const cleanCurrent = current.replace(/^v/, "");
  const cleanLatest = latest.replace(/^v/, "");

  const currentParts = cleanCurrent.split(".").map((p) => parseInt(p, 10));
  const latestParts = cleanLatest.split(".").map((p) => parseInt(p, 10));

  // Compare each part
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const curr = currentParts[i] ?? 0;
    const lat = latestParts[i] ?? 0;
    if (lat > curr) return true;
    if (lat < curr) return false;
  }

  return false; // Versions are equal
}

/**
 * Check for updates (non-blocking, cached).
 * Returns the latest version if an update is available, null otherwise.
 */
export async function checkForUpdates(
  currentVersion: string,
): Promise<string | null> {
  try {
    // Check if cache is fresh
    const cache = await readCache();
    const now = Date.now();

    if (cache && now - cache.lastCheck < CHECK_INTERVAL_MS) {
      // Cache is fresh, use cached version
      if (compareVersions(currentVersion, cache.latestVersion)) {
        return cache.latestVersion;
      }
      return null;
    }

    // Cache is stale or missing, fetch from GitHub
    const apiUrl = `https://api.github.com/repos/${REPO}/releases/latest`;
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return null; // Fail silently
    }

    const releaseInfo = await response.json();
    const latestVersion = releaseInfo.tag_name as string;

    // Update cache
    await writeCache({
      lastCheck: now,
      latestVersion,
    });

    // Check if update is available
    if (compareVersions(currentVersion, latestVersion)) {
      return latestVersion;
    }

    return null;
  } catch {
    // Fail silently on any error
    return null;
  }
}

/** Display a styled update notification */
export function displayUpdateNotification(
  currentVersion: string,
  latestVersion: string,
): void {
  const current = currentVersion.replace(/^v/, "");
  const latest = latestVersion.replace(/^v/, "");

  box([
    `${yellow("Update available:")} ${dim(`v${current}`)} → ${
      cyan(`v${latest}`)
    }`,
    `Run: ${bold("curl -fsSL https://wcp.dev/install | bash")}`,
  ]);
}
