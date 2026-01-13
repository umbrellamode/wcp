import { assertEquals } from "jsr:@std/assert";
import { type Command, parseArgs } from "../src/cli/args.ts";

Deno.test("parseArgs - empty args returns help", () => {
  const result = parseArgs([]);
  assertEquals(result.type, "help");
});

Deno.test("parseArgs - help command", () => {
  assertEquals(parseArgs(["help"]).type, "help");
  assertEquals(parseArgs(["--help"]).type, "help");
  assertEquals(parseArgs(["-h"]).type, "help");
});

Deno.test("parseArgs - list command", () => {
  assertEquals(parseArgs(["list"]).type, "list");
  assertEquals(parseArgs(["ls"]).type, "list");
});

Deno.test("parseArgs - kill command with port", () => {
  const result = parseArgs(["kill", "3000"]);
  assertEquals(result.type, "kill");
  if (result.type === "kill") {
    assertEquals(result.port, "3000");
  }
});

Deno.test("parseArgs - dev command", () => {
  const result = parseArgs(["dev"]);
  assertEquals(result.type, "dev");
});

Deno.test("parseArgs - dev with -- creates wormhole named dev", () => {
  const result = parseArgs(["dev", "--", "npm", "run", "dev"]);
  assertEquals(result.type, "create");
  if (result.type === "create") {
    assertEquals(result.port, "dev");
    assertEquals(result.command, ["npm", "run", "dev"]);
  }
});

Deno.test("parseArgs - update command", () => {
  const result = parseArgs(["update"]);
  assertEquals(result.type, "update");
});

Deno.test("parseArgs - init command", () => {
  const result = parseArgs(["init"]);
  assertEquals(result.type, "init");
});

Deno.test("parseArgs - kill command without port returns error", () => {
  const result = parseArgs(["kill"]);
  assertEquals(result.type, "error");
  if (result.type === "error") {
    assertEquals(result.message, "kill requires a port argument");
  }
});

Deno.test("parseArgs - connect mode (port only)", () => {
  const result = parseArgs(["3000"]);
  assertEquals(result.type, "connect");
  if (result.type === "connect") {
    assertEquals(result.port, "3000");
  }
});

Deno.test("parseArgs - connect mode with named port", () => {
  const result = parseArgs(["dev-server"]);
  assertEquals(result.type, "connect");
  if (result.type === "connect") {
    assertEquals(result.port, "dev-server");
  }
});

Deno.test("parseArgs - create mode with command", () => {
  const result = parseArgs(["3000", "--", "npm", "run", "dev"]);
  assertEquals(result.type, "create");
  if (result.type === "create") {
    assertEquals(result.port, "3000");
    assertEquals(result.command, ["npm", "run", "dev"]);
  }
});

Deno.test("parseArgs - create mode with single word command", () => {
  const result = parseArgs(["3000", "--", "echo"]);
  assertEquals(result.type, "create");
  if (result.type === "create") {
    assertEquals(result.port, "3000");
    assertEquals(result.command, ["echo"]);
  }
});

Deno.test("parseArgs - create mode with command containing flags", () => {
  const result = parseArgs([
    "8080",
    "--",
    "node",
    "--inspect",
    "server.js",
    "--port",
    "8080",
  ]);
  assertEquals(result.type, "create");
  if (result.type === "create") {
    assertEquals(result.port, "8080");
    assertEquals(result.command, [
      "node",
      "--inspect",
      "server.js",
      "--port",
      "8080",
    ]);
  }
});

Deno.test("parseArgs - error when no command after --", () => {
  const result = parseArgs(["3000", "--"]);
  assertEquals(result.type, "error");
  if (result.type === "error") {
    assertEquals(result.message, "No command specified after --");
  }
});

Deno.test("parseArgs - invalid port identifier", () => {
  const result = parseArgs(["port/with/slashes"]);
  assertEquals(result.type, "error");
  if (result.type === "error") {
    assertEquals(result.message, "Invalid port identifier: port/with/slashes");
  }
});

Deno.test("parseArgs - invalid port with spaces", () => {
  // Note: This would typically be handled by shell splitting,
  // but we test the validation anyway
  const result = parseArgs(["port with spaces"]);
  assertEquals(result.type, "error");
});

Deno.test("parseArgs - valid port identifiers", () => {
  // Note: "dev" is now a command, so we use "devserver" instead
  const validPorts = [
    "3000",
    "devserver",
    "my-server",
    "server_1",
    "my_dev_server",
    "port-3000",
    "PORT_3000",
  ];

  for (const port of validPorts) {
    const result = parseArgs([port]);
    assertEquals(result.type, "connect", `Port "${port}" should be valid`);
    if (result.type === "connect") {
      assertEquals(result.port, port);
    }
  }
});

Deno.test("parseArgs - command with quoted arguments", () => {
  // Shell would have already processed quotes, so we just get the values
  const result = parseArgs([
    "3000",
    "--",
    "bash",
    "-c",
    "echo hello world",
  ]);
  assertEquals(result.type, "create");
  if (result.type === "create") {
    assertEquals(result.command, ["bash", "-c", "echo hello world"]);
  }
});

Deno.test("parseArgs - kill command with named port", () => {
  const result = parseArgs(["kill", "dev-server"]);
  assertEquals(result.type, "kill");
  if (result.type === "kill") {
    assertEquals(result.port, "dev-server");
  }
});

Deno.test("parseArgs - multiple -- separators uses first", () => {
  const result = parseArgs(["3000", "--", "echo", "--", "something"]);
  assertEquals(result.type, "create");
  if (result.type === "create") {
    assertEquals(result.command, ["echo", "--", "something"]);
  }
});

Deno.test("parseArgs - preserves command argument order", () => {
  const result = parseArgs([
    "3000",
    "--",
    "npm",
    "run",
    "dev",
    "--",
    "--host",
    "0.0.0.0",
  ]);
  assertEquals(result.type, "create");
  if (result.type === "create") {
    assertEquals(result.command, [
      "npm",
      "run",
      "dev",
      "--",
      "--host",
      "0.0.0.0",
    ]);
  }
});
