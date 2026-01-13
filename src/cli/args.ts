export type Command =
  | { type: "create"; port: string; command: string[] }
  | { type: "connect"; port: string }
  | { type: "list" }
  | { type: "kill"; port: string }
  | { type: "dev" }
  | { type: "init" }
  | { type: "update" }
  | { type: "help" }
  | { type: "error"; message: string };

/**
 * Parse CLI arguments into a command
 *
 * Formats:
 * - wormhole <port> -- <command...>  -> create
 * - wormhole <port>                  -> connect
 * - wormhole list                    -> list
 * - wormhole kill <port>             -> kill
 * - wormhole dev                     -> dev (detect and select)
 * - wormhole update                  -> update to latest version
 * - wormhole help                    -> help
 */
export function parseArgs(args: string[]): Command {
  if (args.length === 0) {
    return { type: "help" };
  }

  const first = args[0];

  // Special commands
  if (first === "help" || first === "--help" || first === "-h") {
    return { type: "help" };
  }

  if (first === "list" || first === "ls") {
    return { type: "list" };
  }

  if (first === "kill") {
    if (args.length < 2) {
      return { type: "error", message: "kill requires a port argument" };
    }
    return { type: "kill", port: args[1] };
  }

  // Dev command (only when no -- separator, otherwise it's a port named "dev")
  if (first === "dev" && args.indexOf("--") === -1) {
    return { type: "dev" };
  }

  if (first === "update") {
    return { type: "update" };
  }

  if (first === "init") {
    return { type: "init" };
  }

  // Port-based commands
  const port = first;

  // Validate port is a reasonable identifier (alphanumeric, dashes, underscores)
  if (!/^[\w-]+$/.test(port)) {
    return { type: "error", message: `Invalid port identifier: ${port}` };
  }

  // Check for command separator
  const separatorIndex = args.indexOf("--");

  if (separatorIndex === -1) {
    // No command - connect mode
    return { type: "connect", port };
  }

  // Create mode with command
  const command = args.slice(separatorIndex + 1);

  if (command.length === 0) {
    return { type: "error", message: "No command specified after --" };
  }

  return { type: "create", port, command };
}
