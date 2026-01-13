import { assertEquals } from "jsr:@std/assert";
import { RingBuffer } from "../src/utils/ring-buffer.ts";

Deno.test("RingBuffer - empty buffer returns empty array", () => {
  const buffer = new RingBuffer<string>(10);
  assertEquals(buffer.toArray(), []);
  assertEquals(buffer.size(), 0);
});

Deno.test("RingBuffer - single item", () => {
  const buffer = new RingBuffer<string>(10);
  buffer.push("hello");
  assertEquals(buffer.toArray(), ["hello"]);
  assertEquals(buffer.size(), 1);
});

Deno.test("RingBuffer - multiple items within capacity", () => {
  const buffer = new RingBuffer<string>(10);
  buffer.push("one");
  buffer.push("two");
  buffer.push("three");
  assertEquals(buffer.toArray(), ["one", "two", "three"]);
  assertEquals(buffer.size(), 3);
});

Deno.test("RingBuffer - fills to capacity", () => {
  const buffer = new RingBuffer<number>(5);
  for (let i = 1; i <= 5; i++) {
    buffer.push(i);
  }
  assertEquals(buffer.toArray(), [1, 2, 3, 4, 5]);
  assertEquals(buffer.size(), 5);
});

Deno.test("RingBuffer - overwrites oldest when full", () => {
  const buffer = new RingBuffer<number>(3);
  buffer.push(1);
  buffer.push(2);
  buffer.push(3);
  buffer.push(4); // Should overwrite 1
  assertEquals(buffer.toArray(), [2, 3, 4]);
  assertEquals(buffer.size(), 3);
});

Deno.test("RingBuffer - multiple overwrites maintain order", () => {
  const buffer = new RingBuffer<number>(3);
  for (let i = 1; i <= 10; i++) {
    buffer.push(i);
  }
  // Should have the last 3 items: 8, 9, 10
  assertEquals(buffer.toArray(), [8, 9, 10]);
  assertEquals(buffer.size(), 3);
});

Deno.test("RingBuffer - clear resets buffer", () => {
  const buffer = new RingBuffer<string>(5);
  buffer.push("a");
  buffer.push("b");
  buffer.push("c");
  buffer.clear();
  assertEquals(buffer.toArray(), []);
  assertEquals(buffer.size(), 0);
});

Deno.test("RingBuffer - can add items after clear", () => {
  const buffer = new RingBuffer<string>(5);
  buffer.push("a");
  buffer.push("b");
  buffer.clear();
  buffer.push("x");
  buffer.push("y");
  assertEquals(buffer.toArray(), ["x", "y"]);
  assertEquals(buffer.size(), 2);
});

Deno.test("RingBuffer - default capacity is 1000", () => {
  const buffer = new RingBuffer<number>();
  for (let i = 0; i < 1500; i++) {
    buffer.push(i);
  }
  assertEquals(buffer.size(), 1000);
  const arr = buffer.toArray();
  assertEquals(arr[0], 500); // First item should be 500 (oldest remaining)
  assertEquals(arr[999], 1499); // Last item should be 1499
});

Deno.test("RingBuffer - capacity of 1", () => {
  const buffer = new RingBuffer<string>(1);
  buffer.push("first");
  assertEquals(buffer.toArray(), ["first"]);
  buffer.push("second");
  assertEquals(buffer.toArray(), ["second"]);
  assertEquals(buffer.size(), 1);
});

Deno.test("RingBuffer - handles different types", () => {
  interface TestObj {
    id: number;
    name: string;
  }

  const buffer = new RingBuffer<TestObj>(3);
  buffer.push({ id: 1, name: "one" });
  buffer.push({ id: 2, name: "two" });

  const result = buffer.toArray();
  assertEquals(result.length, 2);
  assertEquals(result[0].id, 1);
  assertEquals(result[1].name, "two");
});

Deno.test("RingBuffer - wraparound preserves exact count", () => {
  const buffer = new RingBuffer<number>(5);

  // Add exactly capacity items
  for (let i = 0; i < 5; i++) {
    buffer.push(i);
  }
  assertEquals(buffer.size(), 5);

  // Add one more to trigger wraparound
  buffer.push(5);
  assertEquals(buffer.size(), 5);
  assertEquals(buffer.toArray(), [1, 2, 3, 4, 5]);

  // Add more
  buffer.push(6);
  buffer.push(7);
  assertEquals(buffer.size(), 5);
  assertEquals(buffer.toArray(), [3, 4, 5, 6, 7]);
});

Deno.test("RingBuffer - stress test with many wraparounds", () => {
  const buffer = new RingBuffer<number>(10);

  // Add 1000 items
  for (let i = 0; i < 1000; i++) {
    buffer.push(i);
  }

  const result = buffer.toArray();
  assertEquals(result.length, 10);
  assertEquals(result[0], 990);
  assertEquals(result[9], 999);
});
