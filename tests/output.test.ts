import { assertEquals } from "@std/assert";
import {
  bold,
  colors,
  dim,
  green,
  icons,
  isTTY,
  red,
  yellow,
} from "../src/cli/output.ts";

Deno.test("isTTY returns boolean", () => {
  const result = isTTY();
  assertEquals(typeof result, "boolean");
});

Deno.test("icons object contains expected icons", () => {
  assertEquals(icons.success, "✓");
  assertEquals(icons.error, "✗");
  assertEquals(icons.warning, "⚠");
  assertEquals(icons.info, "ℹ");
  assertEquals(icons.arrow, "›");
  assertEquals(icons.bullet, "•");
  assertEquals(icons.diamond, "◆");
  assertEquals(icons.wcp, "◈");
});

Deno.test("colors object contains ANSI codes", () => {
  assertEquals(colors.reset, "\x1b[0m");
  assertEquals(colors.bold, "\x1b[1m");
  assertEquals(colors.dim, "\x1b[2m");
  assertEquals(colors.green, "\x1b[32m");
  assertEquals(colors.red, "\x1b[31m");
  assertEquals(colors.yellow, "\x1b[33m");
  assertEquals(colors.cyan, "\x1b[36m");
});

Deno.test("text helpers return strings", () => {
  // When not in TTY, helpers should return plain text
  const text = "test";
  assertEquals(typeof bold(text), "string");
  assertEquals(typeof dim(text), "string");
  assertEquals(typeof green(text), "string");
  assertEquals(typeof red(text), "string");
  assertEquals(typeof yellow(text), "string");
});

Deno.test("text helpers contain the original text", () => {
  const text = "hello world";
  assertEquals(bold(text).includes("hello world"), true);
  assertEquals(dim(text).includes("hello world"), true);
  assertEquals(green(text).includes("hello world"), true);
  assertEquals(red(text).includes("hello world"), true);
  assertEquals(yellow(text).includes("hello world"), true);
});
