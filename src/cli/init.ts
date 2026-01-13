import { exists } from "@std/fs";
import { basename } from "@std/path";
import { playWormholeAnimation, spinner } from "./animation.ts";
import { detectProject, type DevOption } from "./detect.ts";
import { selectOption } from "./menu.ts";
import { configExists, writeConfig } from "../utils/config.ts";
import {
  bold,
  box,
  dim,
  green,
  icons,
  info,
  isTTY,
  nextSteps,
  warning,
} from "./output.ts";

interface ProjectInfo {
  name: string;
  type: string;
  commands: { name: string; description: string; command: string }[];
  architecture: DirectoryNode[];
  conventions: string[];
}

interface DirectoryNode {
  name: string;
  description?: string;
  children?: DirectoryNode[];
}

interface ExistingDoc {
  overview?: string;
  customSections: { heading: string; content: string }[];
}

/**
 * Scan the project and generate/update CLAUDE.md, AGENTS.md, and WCP.md
 */
export async function initDocs(): Promise<void> {
  // Play the wormhole animation intro
  await playWormholeAnimation(1500);

  // Animated scanning phase
  const scanSteps = [
    "Detecting project type...",
    "Scanning directory structure...",
    "Analyzing configuration...",
    "Reading existing docs...",
    "Detecting dev commands...",
  ];

  let stepIndex = 0;
  const startTime = Date.now();

  const updateStatus = (frame: number): string | null => {
    const elapsed = Date.now() - startTime;
    const targetStep = Math.min(
      Math.floor(elapsed / 300),
      scanSteps.length - 1,
    );

    if (elapsed > scanSteps.length * 300 + 200) {
      return null; // Done
    }

    stepIndex = targetStep;
    return `${spinner(frame)} ${scanSteps[stepIndex]}`;
  };

  // Show animated progress
  await animatedProgress(updateStatus);

  // Actually do the work
  const projectInfo = await scanProject();

  // Preserve custom content from existing docs
  const existingClaude = await parseExistingDoc("CLAUDE.md");
  const existingAgents = await parseExistingDoc("AGENTS.md");

  const claudeMd = generateClaudeMd(projectInfo, existingClaude);
  const agentsMd = generateAgentsMd(projectInfo, existingAgents);

  await Deno.writeTextFile("CLAUDE.md", claudeMd);
  await Deno.writeTextFile("AGENTS.md", agentsMd);

  // Detect and save dev command
  const project = await detectProject();
  let devCommand: DevOption | null = null;

  if (project && project.options.length > 0) {
    console.log("");
    const typeLabel = project.packageManager
      ? `${project.type} (${project.packageManager})`
      : project.type;
    info(`Detected ${bold(typeLabel)} project`);

    if (project.options.length === 1) {
      // Auto-select if only one option
      devCommand = project.options[0];
      info(`Found dev command: ${bold(devCommand.cmd.join(" "))}`);
    } else if (isTTY()) {
      // Interactive selection for multiple options
      console.log("");
      const menuOptions = project.options.map((opt) => ({
        label: opt.name,
        description: opt.cmd.join(" "),
        value: opt,
      }));

      devCommand = await selectOption(
        menuOptions,
        "Select default dev command:",
      );
    } else {
      // Non-TTY: use first option
      devCommand = project.options[0];
      info(`Using dev command: ${bold(devCommand.cmd.join(" "))}`);
    }
  }

  // Check for existing config and handle appropriately
  const hasExistingConfig = await configExists();
  if (hasExistingConfig && isTTY()) {
    warning("Existing WCP.md found - will be updated");
  }

  // Write WCP.md config
  await writeConfig(
    project?.type ?? "unknown",
    project?.packageManager,
    devCommand,
  );

  // Display success
  const successLines = [
    `${green(icons.success)} CLAUDE.md`,
    `${green(icons.success)} AGENTS.md`,
    `${green(icons.success)} WCP.md`,
  ];

  if (devCommand) {
    successLines.push("");
    successLines.push(`Dev command: ${dim(devCommand.cmd.join(" "))}`);
  }

  box(successLines, `${icons.wcp} Initialization Complete`);

  // Show next steps
  const steps: string[] = [];

  if (devCommand) {
    steps.push(`Run ${bold("wcp start")} to start your dev server`);
    steps.push(`Run ${bold("wcp watch")} in another terminal to monitor logs`);
  } else {
    steps.push(`Run ${bold("wcp dev")} to manually select a dev command`);
  }

  steps.push(`Edit ${bold("WCP.md")} to customize settings`);

  nextSteps(steps);
}

/**
 * Display animated progress with a 3D cube
 */
async function animatedProgress(
  getStatus: (frame: number) => string | null,
): Promise<void> {
  // Skip animation if not in TTY
  if (!isTTY()) {
    console.log("Scanning project...");
    return;
  }

  const FRAME_DELAY = 50;
  const width = 44;
  const height = 14;

  // Hide cursor
  Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25l"));

  try {
    let frame = 0;

    while (true) {
      const status = getStatus(frame);
      if (status === null) break;

      const cubeLines = generate3DCube(frame, width, height);

      // Clear screen
      Deno.stdout.writeSync(new TextEncoder().encode("\x1b[2J\x1b[H"));

      // Print frame
      console.log("");
      for (const line of cubeLines) {
        console.log("  " + line);
      }
      console.log("");
      console.log("  " + status);

      frame++;
      await new Promise((r) => setTimeout(r, FRAME_DELAY));
    }
  } finally {
    // Show cursor
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));
    // Clear screen
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[2J\x1b[H"));
  }
}

/**
 * Generate a rotating 3D cube wireframe
 */
function generate3DCube(
  frame: number,
  width: number,
  height: number,
): string[] {
  const canvas: string[][] = [];
  for (let y = 0; y < height; y++) {
    canvas.push(new Array(width).fill(" "));
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const size = Math.min(width, height * 2) * 0.25;

  // Rotation angles
  const angleX = frame * 0.04;
  const angleY = frame * 0.06;
  const angleZ = frame * 0.02;

  // Cube vertices
  const vertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];

  // Cube edges
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0], // back face
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4], // front face
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7], // connecting edges
  ];

  // Project vertices with 3D rotation
  const projected = vertices.map(([x, y, z]) => {
    // Rotate around X
    const y1 = y * Math.cos(angleX) - z * Math.sin(angleX);
    const z1 = y * Math.sin(angleX) + z * Math.cos(angleX);

    // Rotate around Y
    const x2 = x * Math.cos(angleY) + z1 * Math.sin(angleY);
    const z2 = -x * Math.sin(angleY) + z1 * Math.cos(angleY);

    // Rotate around Z
    const x3 = x2 * Math.cos(angleZ) - y1 * Math.sin(angleZ);
    const y3 = x2 * Math.sin(angleZ) + y1 * Math.cos(angleZ);

    // Project to 2D with perspective
    const perspective = 3 / (4 + z2);
    return [
      Math.floor(centerX + x3 * size * perspective),
      Math.floor(centerY + y3 * size * perspective * 0.5),
      z2, // Keep Z for depth sorting
    ];
  });

  // Draw edges (sorted by depth for proper occlusion would be nice but keep it simple)
  for (const [i, j] of edges) {
    const [x1, y1] = projected[i];
    const [x2, y2] = projected[j];
    drawLine(canvas, x1, y1, x2, y2);
  }

  // Draw vertices as bright points
  for (const [x, y] of projected) {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      canvas[y][x] = "◆";
    }
  }

  // Add "wcp" text in the middle that pulses
  const pulse = Math.sin(frame * 0.15) * 0.5 + 0.5;
  if (pulse > 0.3) {
    const text = "◈ wcp ◈";
    const textX = Math.floor(centerX - text.length / 2);
    const textY = Math.floor(centerY);
    for (let i = 0; i < text.length; i++) {
      if (textX + i >= 0 && textX + i < width && textY >= 0 && textY < height) {
        canvas[textY][textX + i] = text[i];
      }
    }
  }

  return canvas.map((row) => row.join(""));
}

/**
 * Draw a line using Bresenham's algorithm
 */
function drawLine(
  canvas: string[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  let x = x1;
  let y = y1;

  const height = canvas.length;
  const width = canvas[0]?.length ?? 0;

  while (true) {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      // Choose character based on line direction
      if (dx > dy * 2) {
        canvas[y][x] = "─";
      } else if (dy > dx * 2) {
        canvas[y][x] = "│";
      } else if ((sx > 0) === (sy > 0)) {
        canvas[y][x] = "╲";
      } else {
        canvas[y][x] = "╱";
      }
    }

    if (x === x2 && y === y2) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/**
 * Parse existing doc file to preserve the Project Overview content
 */
async function parseExistingDoc(filename: string): Promise<ExistingDoc> {
  const result: ExistingDoc = { customSections: [] };

  if (!(await exists(filename))) {
    return result;
  }

  try {
    const content = await Deno.readTextFile(filename);
    const lines = content.split("\n");

    let currentHeading = "";
    let currentContent: string[] = [];

    for (const line of lines) {
      // Detect heading
      const headingMatch = line.match(/^##\s+(.+)$/);
      if (headingMatch) {
        // Save previous section if it was overview
        if (
          currentHeading.toLowerCase() === "project overview" &&
          currentContent.length > 0
        ) {
          result.overview = currentContent.join("\n").trim();
        }

        currentHeading = headingMatch[1];
        currentContent = [];
        continue;
      }

      currentContent.push(line);
    }

    // Check the last section
    if (
      currentHeading.toLowerCase() === "project overview" &&
      currentContent.length > 0
    ) {
      result.overview = currentContent.join("\n").trim();
    }
  } catch {
    // Ignore errors reading existing file
  }

  return result;
}

async function scanProject(): Promise<ProjectInfo> {
  const name = await getProjectName();
  const type = await detectProjectType();
  const commands = await getProjectCommands(type);
  const architecture = await scanArchitecture(".");
  const conventions = await detectConventions(type);

  return { name, type, commands, architecture, conventions };
}

async function getProjectName(): Promise<string> {
  // Try package.json
  if (await exists("package.json")) {
    try {
      const content = await Deno.readTextFile("package.json");
      const pkg = JSON.parse(content);
      if (pkg.name) return pkg.name;
    } catch { /* ignore */ }
  }

  // Try deno.json
  if (await exists("deno.json")) {
    try {
      const content = await Deno.readTextFile("deno.json");
      const config = JSON.parse(content);
      if (config.name) return config.name;
    } catch { /* ignore */ }
  }

  // Try Cargo.toml
  if (await exists("Cargo.toml")) {
    try {
      const content = await Deno.readTextFile("Cargo.toml");
      const match = content.match(/name\s*=\s*"([^"]+)"/);
      if (match) return match[1];
    } catch { /* ignore */ }
  }

  // Fall back to directory name
  return basename(Deno.cwd());
}

async function detectProjectType(): Promise<string> {
  if (await exists("deno.json") || await exists("deno.jsonc")) return "deno";
  if (await exists("package.json")) return "node";
  if (await exists("Cargo.toml")) return "rust";
  if (await exists("go.mod")) return "go";
  if (await exists("pyproject.toml") || await exists("setup.py")) {
    return "python";
  }
  return "unknown";
}

async function getProjectCommands(
  type: string,
): Promise<{ name: string; description: string; command: string }[]> {
  const commands: { name: string; description: string; command: string }[] = [];

  if (type === "deno" && await exists("deno.json")) {
    try {
      const content = await Deno.readTextFile("deno.json");
      const config = JSON.parse(content);
      const tasks = config.tasks || {};

      for (const [name, _cmd] of Object.entries(tasks)) {
        commands.push({
          name,
          description: describeTask(name),
          command: `deno task ${name}`,
        });
      }
    } catch { /* ignore */ }
  }

  if (type === "node" && await exists("package.json")) {
    try {
      const content = await Deno.readTextFile("package.json");
      const pkg = JSON.parse(content);
      const scripts = pkg.scripts || {};

      for (const [name] of Object.entries(scripts)) {
        commands.push({
          name,
          description: describeTask(name),
          command: `npm run ${name}`,
        });
      }
    } catch { /* ignore */ }
  }

  if (type === "rust") {
    commands.push(
      {
        name: "build",
        description: "Build the project",
        command: "cargo build",
      },
      { name: "run", description: "Run the project", command: "cargo run" },
      { name: "test", description: "Run tests", command: "cargo test" },
    );
  }

  if (type === "go") {
    commands.push(
      { name: "build", description: "Build the project", command: "go build" },
      { name: "run", description: "Run the project", command: "go run ." },
      { name: "test", description: "Run tests", command: "go test ./..." },
    );
  }

  if (type === "python") {
    commands.push(
      {
        name: "install",
        description: "Install dependencies",
        command: "pip install -e .",
      },
      { name: "test", description: "Run tests", command: "pytest" },
    );
  }

  return commands;
}

function describeTask(name: string): string {
  const descriptions: Record<string, string> = {
    dev: "Start development server",
    start: "Start the application",
    build: "Build for production",
    test: "Run tests",
    lint: "Run linter",
    format: "Format code",
    compile: "Compile to binary",
    watch: "Watch for changes",
    serve: "Serve the application",
    clean: "Clean build artifacts",
    install: "Install dependencies",
  };
  return descriptions[name] || `Run ${name} task`;
}

async function scanArchitecture(
  dir: string,
  depth = 0,
  maxDepth = 3,
): Promise<DirectoryNode[]> {
  if (depth >= maxDepth) return [];

  const nodes: DirectoryNode[] = [];
  const ignoreDirs = new Set([
    "node_modules",
    ".git",
    "target",
    "dist",
    "build",
    ".next",
    "__pycache__",
    ".venv",
    "venv",
    ".cache",
    "coverage",
  ]);

  const ignoreFiles = new Set([
    ".DS_Store",
    ".gitignore",
    ".env",
    ".env.local",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "deno.lock",
    "Cargo.lock",
  ]);

  try {
    const entries: Deno.DirEntry[] = [];
    for await (const entry of Deno.readDir(dir)) {
      entries.push(entry);
    }

    // Sort: directories first, then files
    entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".github") continue;
      if (ignoreDirs.has(entry.name)) continue;
      if (ignoreFiles.has(entry.name)) continue;

      const node: DirectoryNode = {
        name: entry.name,
        description: inferDescription(join(dir, entry.name), entry),
      };

      if (entry.isDirectory) {
        const children = await scanArchitecture(
          join(dir, entry.name),
          depth + 1,
          maxDepth,
        );
        if (children.length > 0) {
          node.children = children;
        }
      }

      nodes.push(node);
    }
  } catch { /* ignore permission errors */ }

  return nodes;
}

function inferDescription(
  _path: string,
  entry: Deno.DirEntry,
): string | undefined {
  const name = entry.name.toLowerCase();

  // Common directory descriptions
  const dirDescriptions: Record<string, string> = {
    src: "Source code",
    lib: "Library code",
    core: "Core functionality",
    cli: "Command-line interface",
    api: "API endpoints",
    utils: "Utility functions",
    helpers: "Helper functions",
    components: "UI components",
    pages: "Page components/routes",
    routes: "Route handlers",
    models: "Data models",
    services: "Service layer",
    middleware: "Middleware functions",
    hooks: "Custom hooks",
    store: "State management",
    types: "Type definitions",
    interfaces: "Interface definitions",
    tests: "Test files",
    __tests__: "Test files",
    fixtures: "Test fixtures",
    mocks: "Mock data",
    config: "Configuration",
    public: "Static assets",
    static: "Static files",
    assets: "Asset files",
    styles: "Stylesheets",
    scripts: "Build/utility scripts",
    docs: "Documentation",
    examples: "Example code",
  };

  // Common file descriptions
  const fileDescriptions: Record<string, string> = {
    "mod.ts": "Entry point",
    "main.ts": "Entry point",
    "index.ts": "Entry point",
    "index.js": "Entry point",
    "app.ts": "Application entry",
    "app.js": "Application entry",
    "readme.md": "Documentation",
    "claude.md": "AI agent guidance",
    "agents.md": "AI agent guidance",
    "package.json": "Node.js configuration",
    "deno.json": "Deno configuration",
    "tsconfig.json": "TypeScript configuration",
    "cargo.toml": "Rust configuration",
    "go.mod": "Go module configuration",
    "makefile": "Build automation",
    "dockerfile": "Container definition",
    "docker-compose.yml": "Container orchestration",
  };

  if (entry.isDirectory) {
    return dirDescriptions[name];
  }

  return fileDescriptions[name];
}

async function detectConventions(type: string): Promise<string[]> {
  const conventions: string[] = [];

  // Check for TypeScript
  if (await exists("tsconfig.json") || type === "deno") {
    conventions.push("TypeScript for type safety");
  }

  // Check for ESLint
  if (
    await exists(".eslintrc.json") ||
    await exists(".eslintrc.js") ||
    await exists("eslint.config.js")
  ) {
    conventions.push("ESLint for code linting");
  }

  // Check for Prettier
  if (await exists(".prettierrc") || await exists(".prettierrc.json")) {
    conventions.push("Prettier for code formatting");
  }

  // Check for testing frameworks
  if (await exists("jest.config.js") || await exists("jest.config.ts")) {
    conventions.push("Jest for testing");
  }
  if (await exists("vitest.config.ts")) {
    conventions.push("Vitest for testing");
  }

  // Deno-specific
  if (type === "deno") {
    conventions.push("Deno standard library preferred over npm packages");
    conventions.push("Use `deno fmt` for formatting");
    conventions.push("Use `deno lint` for linting");
  }

  return conventions;
}

function generateClaudeMd(info: ProjectInfo, existing: ExistingDoc): string {
  const lines: string[] = [];

  lines.push("# CLAUDE.md");
  lines.push("");
  lines.push(
    "This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.",
  );
  lines.push("");

  lines.push("## Project Overview");
  lines.push("");
  // Preserve existing overview if present, otherwise generate default
  if (existing.overview) {
    lines.push(existing.overview);
  } else {
    lines.push(`This is a ${info.type} project named \`${info.name}\`.`);
  }
  lines.push("");

  if (info.commands.length > 0) {
    lines.push("## Commands");
    lines.push("");
    lines.push("```bash");
    for (const cmd of info.commands) {
      lines.push(`# ${cmd.description}`);
      lines.push(cmd.command);
      lines.push("");
    }
    lines.push("```");
    lines.push("");
  }

  lines.push("## Architecture");
  lines.push("");
  lines.push("```");
  lines.push(renderTree(info.architecture, ""));
  lines.push("```");
  lines.push("");

  if (info.conventions.length > 0) {
    lines.push("## Key Conventions");
    lines.push("");
    for (const convention of info.conventions) {
      lines.push(`- ${convention}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function generateAgentsMd(info: ProjectInfo, existing: ExistingDoc): string {
  const lines: string[] = [];

  lines.push("# AGENTS.md");
  lines.push("");
  lines.push(
    "This file provides guidance to AI coding agents when working with this codebase.",
  );
  lines.push("");

  lines.push("## Project Overview");
  lines.push("");
  // Preserve existing overview if present, otherwise generate default
  if (existing.overview) {
    lines.push(existing.overview);
  } else {
    lines.push(`**${info.name}** - A ${info.type} project.`);
  }
  lines.push("");

  if (info.commands.length > 0) {
    lines.push("## Development Commands");
    lines.push("");
    for (const cmd of info.commands) {
      lines.push(`- **${cmd.name}**: \`${cmd.command}\` - ${cmd.description}`);
    }
    lines.push("");
  }

  lines.push("## Project Structure");
  lines.push("");
  lines.push("```");
  lines.push(renderTree(info.architecture, ""));
  lines.push("```");
  lines.push("");

  if (info.conventions.length > 0) {
    lines.push("## Conventions");
    lines.push("");
    for (const convention of info.conventions) {
      lines.push(`- ${convention}`);
    }
    lines.push("");
  }

  lines.push("## Guidelines");
  lines.push("");
  lines.push("- Read and understand existing code before making changes");
  lines.push("- Follow the existing code style and patterns");
  lines.push("- Run tests before submitting changes");
  lines.push("- Keep changes focused and minimal");
  lines.push("");

  return lines.join("\n");
}

function renderTree(nodes: DirectoryNode[], prefix: string): string {
  const lines: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";

    let line = prefix + connector + node.name;
    if (node.description) {
      // Pad to align descriptions
      const padding = Math.max(1, 30 - line.length);
      line += " ".repeat(padding) + "# " + node.description;
    }
    lines.push(line);

    if (node.children && node.children.length > 0) {
      lines.push(renderTree(node.children, prefix + childPrefix));
    }
  }

  return lines.join("\n");
}
