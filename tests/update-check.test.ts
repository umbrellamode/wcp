import { assertEquals } from "@std/assert";
import { compareVersions, getCachePath } from "../src/utils/update-check.ts";

Deno.test("getCachePath returns path in ~/.wcp directory", () => {
  const path = getCachePath();
  assertEquals(path.includes(".wcp"), true);
  assertEquals(path.endsWith("update-check.json"), true);
});

Deno.test("compareVersions - newer version available", () => {
  assertEquals(compareVersions("0.3.0", "0.4.0"), true);
  assertEquals(compareVersions("0.3.0", "0.3.1"), true);
  assertEquals(compareVersions("0.3.0", "1.0.0"), true);
  assertEquals(compareVersions("1.0.0", "2.0.0"), true);
  assertEquals(compareVersions("0.0.1", "0.0.2"), true);
});

Deno.test("compareVersions - same version", () => {
  assertEquals(compareVersions("0.3.0", "0.3.0"), false);
  assertEquals(compareVersions("1.0.0", "1.0.0"), false);
  assertEquals(compareVersions("0.0.1", "0.0.1"), false);
});

Deno.test("compareVersions - older version (no update)", () => {
  assertEquals(compareVersions("0.4.0", "0.3.0"), false);
  assertEquals(compareVersions("1.0.0", "0.9.0"), false);
  assertEquals(compareVersions("2.0.0", "1.9.9"), false);
});

Deno.test("compareVersions - handles v prefix", () => {
  assertEquals(compareVersions("v0.3.0", "v0.4.0"), true);
  assertEquals(compareVersions("0.3.0", "v0.4.0"), true);
  assertEquals(compareVersions("v0.3.0", "0.4.0"), true);
  assertEquals(compareVersions("v0.3.0", "v0.3.0"), false);
});

Deno.test("compareVersions - handles different segment lengths", () => {
  assertEquals(compareVersions("1.0", "1.0.1"), true);
  assertEquals(compareVersions("1.0.0", "1.1"), true);
  assertEquals(compareVersions("1", "1.0.1"), true);
  assertEquals(compareVersions("1.0.0", "1"), false);
});

Deno.test("compareVersions - major version changes", () => {
  assertEquals(compareVersions("0.9.9", "1.0.0"), true);
  assertEquals(compareVersions("1.9.9", "2.0.0"), true);
  assertEquals(compareVersions("9.9.9", "10.0.0"), true);
});
