import { join } from "@std/path";
import { exists } from "@std/fs";

/**
 * WCP project configuration stored in WCP.md
 */
export interface WcpConfig {
  project: {
    type: string;
    packageManager?: string;
  };
  devServer: {
    name: string;
    command: string[];
    source: string;
  } | null;
}

const CONFIG_FILE = "WCP.md";

/** Get the config file path */
export function getConfigPath(): string {
  return join(Deno.cwd(), CONFIG_FILE);
}

/** Check if config exists */
export async function configExists(): Promise<boolean> {
  return await exists(getConfigPath());
}

/** Read the config from WCP.md */
export async function readConfig(): Promise<WcpConfig | null> {
  const configPath = getConfigPath();
  if (!(await exists(configPath))) {
    return null;
  }
  try {
    const content = await Deno.readTextFile(configPath);
    return parseWcpMd(content);
  } catch {
    return null;
  }
}

/** Parse WCP.md content to extract config */
function parseWcpMd(content: string): WcpConfig | null {
  try {
    // Extract JSON from the ```json code block in the Configuration section
    const jsonMatch = content.match(
      /## Configuration\s+```json\s*([\s\S]*?)\s*```/,
    );
    if (!jsonMatch) {
      return null;
    }

    const json = JSON.parse(jsonMatch[1]);

    return {
      project: {
        type: json.project?.type ?? "unknown",
        packageManager: json.project?.packageManager,
      },
      devServer: json.devServer
        ? {
          name: json.devServer.name,
          command: json.devServer.command,
          source: json.devServer.source,
        }
        : null,
    };
  } catch {
    return null;
  }
}

/** Generate WCP.md content */
export function generateWcpMd(
  projectType: string,
  packageManager: string | undefined,
  devServer: { name: string; cmd: string[]; source: string } | null,
): string {
  const config = {
    project: {
      type: projectType,
      ...(packageManager && { packageManager }),
    },
    devServer: devServer
      ? {
        name: devServer.name,
        command: devServer.cmd,
        source: devServer.source,
      }
      : null,
  };

  const devCommandDisplay = devServer
    ? devServer.cmd.join(" ")
    : "Not configured";

  const lines: string[] = [];

  lines.push("# WCP.md");
  lines.push("");
  lines.push(
    "This file configures [wcp](https://wcp.dev) for this project.",
  );
  lines.push("");

  lines.push("## Quick Start");
  lines.push("");
  lines.push("```bash");
  lines.push("wcp start   # Start dev server");
  lines.push("wcp watch   # Monitor logs (in another terminal)");
  lines.push("wcp status  # Show current configuration");
  lines.push("```");
  lines.push("");

  lines.push("## Dev Server");
  lines.push("");
  if (devServer) {
    lines.push(`**Command:** \`${devCommandDisplay}\``);
    lines.push("");
    lines.push(`**Source:** ${devServer.source}`);
  } else {
    lines.push("No dev server configured. Run `wcp dev` to select one.");
  }
  lines.push("");

  lines.push("## Configuration");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(config, null, 2));
  lines.push("```");
  lines.push("");

  lines.push("## About");
  lines.push("");
  lines.push(
    "wcp creates Unix domain sockets for sharing terminal output across",
  );
  lines.push(
    "multiple processes. Run background dev servers while monitoring logs",
  );
  lines.push("from external terminals.");
  lines.push("");
  lines.push("Learn more: https://wcp.dev");
  lines.push("");

  return lines.join("\n");
}

/** Write the WCP.md config file */
export async function writeConfig(
  projectType: string,
  packageManager: string | undefined,
  devServer: { name: string; cmd: string[]; source: string } | null,
): Promise<void> {
  const content = generateWcpMd(projectType, packageManager, devServer);
  await Deno.writeTextFile(getConfigPath(), content);
}

/** Create a config object (for backwards compatibility) */
export function createConfig(
  projectType: string,
  packageManager: string | undefined,
  devServer: { name: string; cmd: string[]; source: string } | null,
): WcpConfig {
  return {
    project: {
      type: projectType,
      packageManager,
    },
    devServer: devServer
      ? {
        name: devServer.name,
        command: devServer.cmd,
        source: devServer.source,
      }
      : null,
  };
}
