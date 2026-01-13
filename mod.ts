import { parseArgs } from "./src/cli/args.ts";
import { executeCommand } from "./src/cli/commands.ts";

if (import.meta.main) {
  const command = parseArgs(Deno.args);
  await executeCommand(command);
}
