import { join } from "jsr:@std/path@^1";
import { ensureDir, exists } from "jsr:@std/fs@^1";

const WCP_DIR = ".wcp";

/** Get the wcp directory path (~/.wcp) */
export function getWcpDir(): string {
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? ".";
  return join(home, WCP_DIR);
}

/** Get socket path for a given port identifier */
export function getSocketPath(port: string): string {
  return join(getWcpDir(), `wcp-${port}.sock`);
}

/** Ensure the wcp directory exists */
export async function ensureWcpDir(): Promise<void> {
  await ensureDir(getWcpDir());
}

/** Check if a socket file exists */
export async function socketExists(port: string): Promise<boolean> {
  return await exists(getSocketPath(port));
}

/** List all active wcp socket files */
export async function listSockets(): Promise<string[]> {
  const dir = getWcpDir();
  const sockets: string[] = [];

  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.name.startsWith("wcp-") && entry.name.endsWith(".sock")) {
        const port = entry.name.replace("wcp-", "").replace(".sock", "");
        sockets.push(port);
      }
    }
  } catch {
    // Directory may not exist yet
  }

  return sockets;
}

/** Remove a socket file */
export async function removeSocket(port: string): Promise<void> {
  try {
    await Deno.remove(getSocketPath(port));
  } catch {
    // Socket may already be removed
  }
}
