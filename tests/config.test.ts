import { assertEquals, assertExists } from "@std/assert";
import {
  createConfig,
  generateWcpMd,
  getConfigPath,
} from "../src/utils/config.ts";

Deno.test("getConfigPath returns WCP.md path", () => {
  const path = getConfigPath();
  assertEquals(path.endsWith("WCP.md"), true);
});

Deno.test("createConfig creates valid config object", () => {
  const config = createConfig(
    "Node.js",
    "npm",
    { name: "dev", cmd: ["npm", "run", "dev"], source: "package.json" },
  );

  assertEquals(config.project.type, "Node.js");
  assertEquals(config.project.packageManager, "npm");
  assertEquals(config.devServer?.command, ["npm", "run", "dev"]);
});

Deno.test("createConfig handles null devServer", () => {
  const config = createConfig("unknown", undefined, null);

  assertEquals(config.devServer, null);
  assertEquals(config.project.packageManager, undefined);
});

Deno.test("createConfig preserves devServer details", () => {
  const devServer = {
    name: "start",
    cmd: ["deno", "task", "start"],
    source: "deno.json",
  };
  const config = createConfig("Deno", undefined, devServer);

  assertEquals(config.devServer?.name, "start");
  assertEquals(config.devServer?.command, ["deno", "task", "start"]);
  assertEquals(config.devServer?.source, "deno.json");
});

Deno.test("generateWcpMd creates valid markdown with JSON config", () => {
  const content = generateWcpMd(
    "Node.js",
    "npm",
    { name: "dev", cmd: ["npm", "run", "dev"], source: "package.json" },
  );

  // Check structure
  assertEquals(content.includes("# WCP.md"), true);
  assertEquals(content.includes("## Quick Start"), true);
  assertEquals(content.includes("## Dev Server"), true);
  assertEquals(content.includes("## Configuration"), true);
  assertEquals(content.includes("## About"), true);

  // Check JSON config block exists
  assertEquals(content.includes("```json"), true);
  assertEquals(content.includes('"project"'), true);
  assertEquals(content.includes('"devServer"'), true);
});

Deno.test("generateWcpMd handles null devServer", () => {
  const content = generateWcpMd("unknown", undefined, null);

  assertEquals(content.includes("# WCP.md"), true);
  assertEquals(content.includes("No dev server configured"), true);
  assertEquals(content.includes('"devServer": null'), true);
});

Deno.test("generateWcpMd includes dev command display", () => {
  const content = generateWcpMd(
    "Deno",
    undefined,
    { name: "dev", cmd: ["deno", "task", "dev"], source: "deno.json" },
  );

  assertEquals(content.includes("**Command:** `deno task dev`"), true);
  assertEquals(content.includes("**Source:** deno.json"), true);
});

Deno.test("generateWcpMd JSON is valid and parseable", () => {
  const content = generateWcpMd(
    "Node.js",
    "pnpm",
    { name: "dev", cmd: ["pnpm", "run", "dev"], source: "package.json" },
  );

  // Extract JSON from markdown
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  assertExists(jsonMatch);

  const json = JSON.parse(jsonMatch[1]);
  assertEquals(json.project.type, "Node.js");
  assertEquals(json.project.packageManager, "pnpm");
  assertEquals(json.devServer.command, ["pnpm", "run", "dev"]);
});
