import { WcpDaemon } from "../core/daemon.ts";
import { WcpClient } from "../core/client.ts";
import {
  getSocketPath,
  listSockets,
  removeSocket,
  socketExists,
} from "../utils/socket.ts";
import { detectProject, type DevOption } from "./detect.ts";
import { selectOption } from "./menu.ts";
import { initDocs } from "./init.ts";
import type { Command } from "./args.ts";

const LOGO = `

 _  _  _ ___ ___
| || || | __| _ \\
| | V V | _||  _/
 \\_/\\_/ |___|_|
`;

const HELP_TEXT = `
wcp - Bidirectional log streaming

USAGE:
  wcp dev                   Detect project and select dev command
  wcp <port> -- <command>   Create wcp and run command
  wcp <port>                Connect to existing wcp
  wcp watch                 Stream all active sessions
  wcp list                  List active wcps
  wcp kill <port>           Close a wcp
  wcp init                  Generate CLAUDE.md and AGENTS.md
  wcp update                Update to latest version
  wcp help                  Show this help

EXAMPLES:
  wcp dev                   Detect and run dev server
  wcp 3000 -- npm run dev   Start dev server in wcp
  wcp 3000                  Connect to wcp 3000
  wcp watch                 Watch all sessions at once
  wcp kill 3000             Kill wcp 3000
  wcp init                  Generate AI agent docs
`;

export async function executeCommand(cmd: Command): Promise<void> {
  switch (cmd.type) {
    case "create":
      await createWormhole(cmd.port, cmd.command);
      break;

    case "connect":
      await connectWormhole(cmd.port);
      break;

    case "list":
      await listWormholes();
      break;

    case "kill":
      await killWormhole(cmd.port);
      break;

    case "dev":
      await devWormhole();
      break;

    case "watch":
      await watchAll();
      break;

    case "init":
      await initDocs();
      break;

    case "update":
      await updateWormhole();
      break;

    case "help":
      console.log(HELP_TEXT);
      break;

    case "error":
      console.error(`Error: ${cmd.message}`);
      console.log("\nRun 'wcp help' for usage.");
      Deno.exit(1);
  }
}

async function createWormhole(port: string, command: string[]): Promise<void> {
  if (await socketExists(port)) {
    console.error(`Wormhole ${port} already exists.`);
    console.log("Use 'wcp kill " + port + "' to close it first.");
    Deno.exit(1);
  }

  const daemon = new WcpDaemon({ port, command });
  await daemon.start();
}

async function connectWormhole(port: string): Promise<void> {
  const client = new WcpClient(port);
  try {
    await client.connect();
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    Deno.exit(1);
  }
}

async function listWormholes(): Promise<void> {
  const sockets = await listSockets();

  if (sockets.length === 0) {
    console.log("No active wcps.");
    return;
  }

  console.log("Active wcps:");
  for (const port of sockets) {
    // Check if socket is actually alive by trying to connect
    const alive = await isSocketAlive(port);
    const status = alive ? "" : " (stale)";
    console.log(`  • Port ${port}${status}`);
  }
}

async function watchAll(): Promise<void> {
  const sockets = await listSockets();

  // Filter to only alive sockets
  const aliveSockets: string[] = [];
  for (const port of sockets) {
    if (await isSocketAlive(port)) {
      aliveSockets.push(port);
    }
  }

  if (aliveSockets.length === 0) {
    console.log("No active wcp sessions to watch.");
    return;
  }

  console.log(`Watching ${aliveSockets.length} session(s): ${aliveSockets.join(", ")}\n`);

  // Create clients for each session with different colors
  const clients = aliveSockets.map((port, index) => {
    const client = new WcpClient(port);
    client.setColor(index);
    return client;
  });

  // Handle SIGINT to exit cleanly
  Deno.addSignalListener("SIGINT", () => {
    console.log("\nStopping watch...");
    Deno.exit(0);
  });

  // Connect to all sessions concurrently
  await Promise.all(clients.map((client) => client.connectWatch()));

  // If all sessions closed, exit
  console.log("\nAll sessions closed.");
}

async function isSocketAlive(port: string): Promise<boolean> {
  try {
    const conn = await Deno.connect({
      path: getSocketPath(port),
      transport: "unix",
    });
    conn.close();
    return true;
  } catch {
    return false;
  }
}

async function killWormhole(port: string): Promise<void> {
  if (!(await socketExists(port))) {
    console.error(`No wcp found on port ${port}`);
    Deno.exit(1);
  }

  // Remove the socket file
  // The daemon will detect this and shut down on its next operation
  await removeSocket(port);
  console.log(`Wormhole ${port} killed.`);
}

async function devWormhole(): Promise<void> {
  console.log(LOGO);

  const project = await detectProject();

  if (!project) {
    console.log("No project detected.");
    console.log("\nSupported project types:");
    console.log("  • package.json (Node.js)");
    console.log("  • deno.json (Deno)");
    console.log("  • Cargo.toml (Rust)");
    console.log("  • go.mod (Go)");
    console.log("  • Makefile");
    console.log("  • docker-compose.yml");
    Deno.exit(1);
  }

  const typeLabel = project.packageManager
    ? `${project.type} (${project.packageManager})`
    : project.type;

  console.log(`Detected: ${typeLabel}\n`);

  const menuOptions = project.options.map((opt: DevOption) => ({
    label: opt.name,
    description: opt.cmd.join(" "),
    value: opt,
  }));

  const selected = await selectOption(menuOptions, "Select a command:");

  if (!selected) {
    console.log("Cancelled.");
    return;
  }

  console.log(`\nStarting wcp with: ${selected.cmd.join(" ")}\n`);

  const daemon = new WcpDaemon({ port: "dev", command: selected.cmd });
  await daemon.start();
}

const SOURCE_URL =
  "https://raw.githubusercontent.com/umbrellamode/wcp/main/mod.ts";

async function updateWormhole(): Promise<void> {
  console.log("Updating wcp...\n");

  const cmd = new Deno.Command("deno", {
    args: ["install", "-gAf", "--name", "wcp", SOURCE_URL],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await cmd.output();

  if (code === 0) {
    console.log("\n✓ Updated successfully!");
  } else {
    console.error("\nUpdate failed. Try reinstalling:");
    console.log("  curl -fsSL https://wcp.dev/install | bash");
    Deno.exit(1);
  }
}
