import { exists } from "jsr:@std/fs@^1";

export interface DevOption {
  name: string;
  cmd: string[];
  source: string;
}

export interface ProjectInfo {
  type: string;
  packageManager?: string;
  options: DevOption[];
}

async function detectPackageManager(): Promise<string> {
  if (await exists("pnpm-lock.yaml")) return "pnpm";
  if (await exists("yarn.lock")) return "yarn";
  if (await exists("bun.lockb")) return "bun";
  return "npm";
}

export async function detectProject(): Promise<ProjectInfo | null> {
  const options: DevOption[] = [];

  // Check package.json (Node.js)
  if (await exists("package.json")) {
    try {
      const content = await Deno.readTextFile("package.json");
      const pkg = JSON.parse(content);
      const pm = await detectPackageManager();

      const scripts = pkg.scripts || {};
      const devScripts = ["dev", "start", "serve", "develop", "watch"];

      for (const script of devScripts) {
        if (scripts[script]) {
          options.push({
            name: script,
            cmd: [pm, "run", script],
            source: "package.json",
          });
        }
      }

      if (options.length > 0) {
        return { type: "Node.js", packageManager: pm, options };
      }
    } catch {
      // Invalid package.json, continue checking
    }
  }

  // Check deno.json (Deno)
  if (await exists("deno.json") || await exists("deno.jsonc")) {
    try {
      const filename = (await exists("deno.json")) ? "deno.json" : "deno.jsonc";
      const content = await Deno.readTextFile(filename);
      const config = JSON.parse(content);

      const tasks = config.tasks || {};
      const devTasks = ["dev", "start", "serve", "watch"];

      for (const task of devTasks) {
        if (tasks[task]) {
          options.push({
            name: task,
            cmd: ["deno", "task", task],
            source: filename,
          });
        }
      }

      if (options.length > 0) {
        return { type: "Deno", options };
      }
    } catch {
      // Invalid deno.json, continue checking
    }
  }

  // Check Cargo.toml (Rust)
  if (await exists("Cargo.toml")) {
    options.push({
      name: "run",
      cmd: ["cargo", "run"],
      source: "Cargo.toml",
    });
    options.push({
      name: "watch",
      cmd: ["cargo", "watch", "-x", "run"],
      source: "Cargo.toml",
    });
    return { type: "Rust", options };
  }

  // Check go.mod (Go)
  if (await exists("go.mod")) {
    options.push({
      name: "run",
      cmd: ["go", "run", "."],
      source: "go.mod",
    });
    options.push({
      name: "air",
      cmd: ["air"],
      source: "go.mod",
    });
    return { type: "Go", options };
  }

  // Check Makefile
  if (await exists("Makefile")) {
    try {
      const content = await Deno.readTextFile("Makefile");
      const targets = ["dev", "start", "serve", "run", "watch"];

      for (const target of targets) {
        // Simple check for target definition
        if (new RegExp(`^${target}:`, "m").test(content)) {
          options.push({
            name: target,
            cmd: ["make", target],
            source: "Makefile",
          });
        }
      }

      if (options.length > 0) {
        return { type: "Make", options };
      }
    } catch {
      // Can't read Makefile, continue
    }
  }

  // Check docker-compose.yml
  if (
    await exists("docker-compose.yml") ||
    await exists("docker-compose.yaml") ||
    await exists("compose.yml") ||
    await exists("compose.yaml")
  ) {
    options.push({
      name: "up",
      cmd: ["docker", "compose", "up"],
      source: "docker-compose",
    });
    options.push({
      name: "up -d",
      cmd: ["docker", "compose", "up", "-d"],
      source: "docker-compose",
    });
    return { type: "Docker Compose", options };
  }

  return null;
}
