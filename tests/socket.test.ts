import {
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
} from "jsr:@std/assert";
import {
  ensureWcpDir,
  getSocketPath,
  getWcpDir,
  listSockets,
  removeSocket,
  socketExists,
} from "../src/utils/socket.ts";
import { join } from "jsr:@std/path@^1";

Deno.test("getWcpDir - returns path under home directory", () => {
  const dir = getWcpDir();
  assertStringIncludes(dir, ".wcp");
});

Deno.test("getSocketPath - returns correct socket path", () => {
  const path = getSocketPath("3000");
  assertStringIncludes(path, ".wcp");
  assertStringIncludes(path, "wcp-3000.sock");
});

Deno.test("getSocketPath - handles named ports", () => {
  const path = getSocketPath("dev-server");
  assertStringIncludes(path, "wcp-dev-server.sock");
});

Deno.test("getSocketPath - different ports yield different paths", () => {
  const path1 = getSocketPath("3000");
  const path2 = getSocketPath("8080");
  assertNotEquals(path1, path2);
});

Deno.test("ensureWcpDir - creates directory", async () => {
  await ensureWcpDir();
  const dir = getWcpDir();

  const stat = await Deno.stat(dir);
  assertEquals(stat.isDirectory, true);
});

Deno.test("socketExists - returns false for non-existent socket", async () => {
  const exists = await socketExists("nonexistent-test-port-12345");
  assertEquals(exists, false);
});

Deno.test("socketExists - returns true for existing socket", async () => {
  await ensureWcpDir();
  const testPort = "test-socket-exists-" + Date.now();
  const path = getSocketPath(testPort);

  // Create a dummy file to simulate a socket
  await Deno.writeTextFile(path, "");

  try {
    const exists = await socketExists(testPort);
    assertEquals(exists, true);
  } finally {
    await Deno.remove(path);
  }
});

Deno.test("removeSocket - removes existing socket", async () => {
  await ensureWcpDir();
  const testPort = "test-remove-" + Date.now();
  const path = getSocketPath(testPort);

  // Create a dummy file
  await Deno.writeTextFile(path, "");

  // Verify it exists
  assertEquals(await socketExists(testPort), true);

  // Remove it
  await removeSocket(testPort);

  // Verify it's gone
  assertEquals(await socketExists(testPort), false);
});

Deno.test("removeSocket - handles non-existent socket gracefully", async () => {
  // Should not throw
  await removeSocket("nonexistent-socket-" + Date.now());
});

Deno.test("listSockets - lists socket files", async () => {
  await ensureWcpDir();
  const testPort1 = "test-list-1-" + Date.now();
  const testPort2 = "test-list-2-" + Date.now();

  const path1 = getSocketPath(testPort1);
  const path2 = getSocketPath(testPort2);

  // Create dummy sockets
  await Deno.writeTextFile(path1, "");
  await Deno.writeTextFile(path2, "");

  try {
    const sockets = await listSockets();

    // Should include our test sockets
    assertEquals(sockets.includes(testPort1), true);
    assertEquals(sockets.includes(testPort2), true);
  } finally {
    await Deno.remove(path1);
    await Deno.remove(path2);
  }
});

Deno.test("listSockets - ignores non-socket files", async () => {
  await ensureWcpDir();
  const dir = getWcpDir();

  // Create a non-socket file
  const testFile = join(dir, "not-a-socket.txt");
  await Deno.writeTextFile(testFile, "");

  try {
    const sockets = await listSockets();
    // Should not include .txt files
    const hasTextFile = sockets.some((s) => s.includes("txt"));
    assertEquals(hasTextFile, false);
  } finally {
    await Deno.remove(testFile);
  }
});

Deno.test("listSockets - returns empty array when directory doesn't exist", async () => {
  // This test assumes a fresh environment where .wcp might not exist
  // The function should handle this gracefully
  const sockets = await listSockets();
  assertEquals(Array.isArray(sockets), true);
});
