import { WcpDaemon } from "../core/daemon.ts";
import { WcpClient } from "../core/client.ts";
import {
  getSocketPath,
  listSockets,
  removeSocket,
  socketExists,
} from "../utils/socket.ts";
import { getConfigPath, readConfig } from "../utils/config.ts";
import { detectProject, type DevOption } from "./detect.ts";
import { selectOption } from "./menu.ts";
import { initDocs } from "./init.ts";
import type { Command } from "./args.ts";
import {
  bold,
  bullet,
  dim,
  error,
  green,
  info,
  nextSteps,
  warning,
  yellow,
} from "./output.ts";

const VERSION = "0.3.0";

const LOGO = `

 _  _  _ ___ ___
| || || | __| _ \\
| | V V | _||  _/
 \\_/\\_/ |___|_|
`;

const HELP_TEXT = `
${bold("wcp")} - Bidirectional log streaming for AI agents

${bold("QUICK START")}
  wcp init              Set up project and detect dev command
  wcp start             Start dev server from saved config
  wcp watch             Monitor logs (auto-starts if needed)

${bold("USAGE")}
  wcp dev               Detect and select dev command interactively
  wcp <id> -- <cmd>     Create named session with command
  wcp <id>              Connect to existing session
  wcp list              List active sessions
  wcp kill <id>         Close a session
  wcp status            Show project config and sessions

${bold("MAINTENANCE")}
  wcp update            Update to latest version
  wcp version           Show version
  wcp help              Show this help

${bold("EXAMPLES")}
  wcp init              # Set up project (creates WCP.md)
  wcp start             # Start configured dev server
  wcp watch             # Watch all sessions
  wcp 3000 -- npm dev   # Run command in named session
  wcp api -- cargo run  # Another named session

${bold("FILES")}
  WCP.md                Project configuration
  ~/.wcp/               Socket files for active sessions
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

    case "start":
      await startFromConfig();
      break;

    case "status":
      await showStatus();
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

    case "version":
      console.log(`wcp v${VERSION}`);
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
    // No active sessions - check if we can auto-start
    const config = await readConfig();

    if (config?.devServer) {
      info("No active sessions found");
      console.log("");
      info(`Starting dev server: ${bold(config.devServer.command.join(" "))}`);
      console.log("");

      const daemon = new WcpDaemon({
        port: "dev",
        command: config.devServer.command,
      });
      await daemon.start();
      return;
    }

    warning("No active wcp sessions to watch");
    nextSteps([
      `Run ${bold("wcp init")} to configure your dev command`,
      `Or run ${bold("wcp dev")} to start a dev server`,
    ]);
    return;
  }

  console.log(
    `  Watching ${bold(String(aliveSockets.length))} session(s): ${
      aliveSockets.join(", ")
    }\n`,
  );

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

async function startFromConfig(): Promise<void> {
  const config = await readConfig();

  if (!config) {
    error("No configuration found");
    nextSteps([
      `Run ${bold("wcp init")} to set up your project`,
    ]);
    Deno.exit(1);
  }

  if (!config.devServer) {
    error("No dev server configured");
    nextSteps([
      `Run ${bold("wcp init")} to detect your dev command`,
      `Or run ${bold("wcp dev")} to select one interactively`,
    ]);
    Deno.exit(1);
  }

  // Check if already running
  if (await socketExists("dev") && await isSocketAlive("dev")) {
    info("Dev server already running. Connecting...");
    console.log("");
    await connectWormhole("dev");
    return;
  }

  console.log(LOGO);
  console.log(`  Starting: ${bold(config.devServer.command.join(" "))}`);
  console.log(`  Source: ${dim(config.devServer.source)}`);
  console.log("");

  const daemon = new WcpDaemon({
    port: "dev",
    command: config.devServer.command,
  });
  await daemon.start();
}

async function showStatus(): Promise<void> {
  console.log(LOGO);

  // Check for config
  const config = await readConfig();

  if (!config) {
    warning("No configuration found");
    console.log("");
    info(`Config path: ${dim(getConfigPath())}`);
    nextSteps([
      `Run ${bold("wcp init")} to set up your project`,
    ]);
    return;
  }

  // Project info
  console.log(`  ${bold("Project")}`);
  bullet(`Type: ${config.project.type}`);
  if (config.project.packageManager) {
    bullet(`Package Manager: ${config.project.packageManager}`);
  }
  console.log("");

  // Dev server info
  console.log(`  ${bold("Dev Server")}`);
  if (config.devServer) {
    bullet(`Command: ${green(config.devServer.command.join(" "))}`);
    bullet(`Source: ${dim(config.devServer.source)}`);
  } else {
    bullet(`${yellow("Not configured")}`);
  }
  console.log("");

  // Active sessions
  const sockets = await listSockets();
  const aliveSockets: string[] = [];
  for (const port of sockets) {
    if (await isSocketAlive(port)) {
      aliveSockets.push(port);
    }
  }

  console.log(`  ${bold("Sessions")}`);
  if (aliveSockets.length > 0) {
    for (const port of aliveSockets) {
      bullet(`${green(port)} ${dim("(running)")}`);
    }
  } else {
    bullet(`${dim("No active sessions")}`);
  }
  console.log("");

  // Config file location
  console.log(`  ${bold("Files")}`);
  bullet(`Config: ${dim(getConfigPath())}`);
  console.log("");
}

async function devWormhole(): Promise<void> {
  // Check if dev wormhole is already running
  if (await socketExists("dev") && await isSocketAlive("dev")) {
    console.log("Dev server already running. Connecting...\n");
    await connectWormhole("dev");
    return;
  }

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

const REPO = "umbrellamode/wcp";

async function updateWormhole(): Promise<void> {
  console.log("Checking for updates...\n");

  // Detect platform
  const os = Deno.build.os;
  const arch = Deno.build.arch;

  let binaryName: string;
  if (os === "darwin" && arch === "aarch64") {
    binaryName = "wcp-darwin-arm64";
  } else if (os === "darwin" && arch === "x86_64") {
    binaryName = "wcp-darwin-x64";
  } else if (os === "linux" && arch === "x86_64") {
    binaryName = "wcp-linux-x64";
  } else {
    console.error(`Unsupported platform: ${os}-${arch}`);
    console.log("Try reinstalling manually:");
    console.log("  curl -fsSL https://wcp.dev/install | bash");
    Deno.exit(1);
  }

  // Get latest release info
  const apiUrl = `https://api.github.com/repos/${REPO}/releases/latest`;
  let releaseInfo;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    releaseInfo = await response.json();
  } catch (error) {
    console.error("Failed to check for updates:", error);
    Deno.exit(1);
  }

  const latestVersion = releaseInfo.tag_name;
  console.log(`Latest version: ${latestVersion}`);

  // Find the download URL for our binary
  const asset = releaseInfo.assets.find((a: { name: string }) =>
    a.name === binaryName
  );
  if (!asset) {
    console.error(`No binary found for ${binaryName}`);
    Deno.exit(1);
  }

  console.log(`Downloading ${binaryName}...`);

  // Download the binary
  const downloadUrl = asset.browser_download_url;
  const binaryResponse = await fetch(downloadUrl);
  if (!binaryResponse.ok) {
    console.error(`Failed to download: ${binaryResponse.status}`);
    Deno.exit(1);
  }

  const binaryData = new Uint8Array(await binaryResponse.arrayBuffer());

  // Find where wcp is installed
  const execPath = Deno.execPath();

  // Write to a temp file first, then replace
  const tempPath = `${execPath}.new`;
  await Deno.writeFile(tempPath, binaryData, { mode: 0o755 });

  // Replace the current binary
  await Deno.rename(tempPath, execPath);

  console.log(`\n✓ Updated to ${latestVersion}!`);
}
