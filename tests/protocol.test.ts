import { assertEquals, assertExists } from "@std/assert";
import {
  encodeMessage,
  MessageReader,
  type WormholeMessage,
} from "../src/core/protocol.ts";

Deno.test("encodeMessage - encodes data message correctly", () => {
  const msg: WormholeMessage = {
    type: "data",
    payload: "hello world",
  };

  const encoded = encodeMessage(msg);

  // First 4 bytes should be the length (big-endian)
  const view = new DataView(encoded.buffer);
  const length = view.getUint32(0, false);

  // Decode the payload
  const payloadBytes = encoded.slice(4);
  assertEquals(payloadBytes.length, length);

  const decoded = JSON.parse(new TextDecoder().decode(payloadBytes));
  assertEquals(decoded.type, "data");
  assertEquals(decoded.payload, "hello world");
});

Deno.test("encodeMessage - encodes all message types", () => {
  const types: WormholeMessage["type"][] = [
    "data",
    "replay-start",
    "replay-end",
    "stdin",
  ];

  for (const type of types) {
    const msg: WormholeMessage = { type, payload: "test" };
    const encoded = encodeMessage(msg);
    assertExists(encoded);

    const view = new DataView(encoded.buffer);
    const length = view.getUint32(0, false);

    const payload = encoded.slice(4);
    assertEquals(payload.length, length);

    const decoded = JSON.parse(new TextDecoder().decode(payload));
    assertEquals(decoded.type, type);
  }
});

Deno.test("encodeMessage - includes timestamp if provided", () => {
  const msg: WormholeMessage = {
    type: "data",
    payload: "test",
    timestamp: 1234567890,
  };

  const encoded = encodeMessage(msg);
  const payload = encoded.slice(4);
  const decoded = JSON.parse(new TextDecoder().decode(payload));

  assertEquals(decoded.timestamp, 1234567890);
});

Deno.test("encodeMessage - handles empty payload", () => {
  const msg: WormholeMessage = {
    type: "replay-end",
    payload: "",
  };

  const encoded = encodeMessage(msg);
  const view = new DataView(encoded.buffer);
  const length = view.getUint32(0, false);

  const payload = encoded.slice(4);
  assertEquals(payload.length, length);

  const decoded = JSON.parse(new TextDecoder().decode(payload));
  assertEquals(decoded.payload, "");
});

Deno.test("encodeMessage - handles unicode payload", () => {
  const msg: WormholeMessage = {
    type: "data",
    payload: "Hello 世界 🌍",
  };

  const encoded = encodeMessage(msg);
  const view = new DataView(encoded.buffer);
  const length = view.getUint32(0, false);

  const payload = encoded.slice(4);
  assertEquals(payload.length, length);

  const decoded = JSON.parse(new TextDecoder().decode(payload));
  assertEquals(decoded.payload, "Hello 世界 🌍");
});

Deno.test("MessageReader - parses single complete message", () => {
  const reader = new MessageReader();
  const msg: WormholeMessage = { type: "data", payload: "hello" };
  const encoded = encodeMessage(msg);

  const messages = reader.feed(encoded);

  assertEquals(messages.length, 1);
  assertEquals(messages[0].type, "data");
  assertEquals(messages[0].payload, "hello");
});

Deno.test("MessageReader - parses multiple complete messages", () => {
  const reader = new MessageReader();

  const msg1: WormholeMessage = { type: "data", payload: "first" };
  const msg2: WormholeMessage = { type: "data", payload: "second" };
  const msg3: WormholeMessage = { type: "replay-end", payload: "" };

  const encoded1 = encodeMessage(msg1);
  const encoded2 = encodeMessage(msg2);
  const encoded3 = encodeMessage(msg3);

  // Combine all messages into one buffer
  const combined = new Uint8Array(
    encoded1.length + encoded2.length + encoded3.length,
  );
  combined.set(encoded1, 0);
  combined.set(encoded2, encoded1.length);
  combined.set(encoded3, encoded1.length + encoded2.length);

  const messages = reader.feed(combined);

  assertEquals(messages.length, 3);
  assertEquals(messages[0].payload, "first");
  assertEquals(messages[1].payload, "second");
  assertEquals(messages[2].type, "replay-end");
});

Deno.test("MessageReader - handles partial message (incomplete length)", () => {
  const reader = new MessageReader();
  const msg: WormholeMessage = { type: "data", payload: "hello" };
  const encoded = encodeMessage(msg);

  // Feed only first 2 bytes (incomplete length header)
  const partial = encoded.slice(0, 2);
  const messages = reader.feed(partial);

  assertEquals(messages.length, 0);
});

Deno.test("MessageReader - handles partial message (incomplete payload)", () => {
  const reader = new MessageReader();
  const msg: WormholeMessage = { type: "data", payload: "hello world" };
  const encoded = encodeMessage(msg);

  // Feed length header + partial payload
  const partial = encoded.slice(0, 10);
  const messages = reader.feed(partial);

  assertEquals(messages.length, 0);
});

Deno.test("MessageReader - completes partial message with second feed", () => {
  const reader = new MessageReader();
  const msg: WormholeMessage = { type: "data", payload: "hello world" };
  const encoded = encodeMessage(msg);

  // Split in the middle
  const part1 = encoded.slice(0, 10);
  const part2 = encoded.slice(10);

  const messages1 = reader.feed(part1);
  assertEquals(messages1.length, 0);

  const messages2 = reader.feed(part2);
  assertEquals(messages2.length, 1);
  assertEquals(messages2[0].payload, "hello world");
});

Deno.test("MessageReader - handles split across multiple feeds", () => {
  const reader = new MessageReader();
  const msg: WormholeMessage = {
    type: "data",
    payload: "this is a longer message",
  };
  const encoded = encodeMessage(msg);

  // Split into many small chunks
  let messages: WormholeMessage[] = [];
  for (let i = 0; i < encoded.length; i += 3) {
    const chunk = encoded.slice(i, Math.min(i + 3, encoded.length));
    messages = messages.concat(reader.feed(chunk));
  }

  assertEquals(messages.length, 1);
  assertEquals(messages[0].payload, "this is a longer message");
});

Deno.test("MessageReader - handles complete + partial in same feed", () => {
  const reader = new MessageReader();

  const msg1: WormholeMessage = { type: "data", payload: "complete" };
  const msg2: WormholeMessage = { type: "data", payload: "partial message" };

  const encoded1 = encodeMessage(msg1);
  const encoded2 = encodeMessage(msg2);

  // Combine complete message + partial second message
  const combined = new Uint8Array(encoded1.length + 5);
  combined.set(encoded1, 0);
  combined.set(encoded2.slice(0, 5), encoded1.length);

  const messages1 = reader.feed(combined);
  assertEquals(messages1.length, 1);
  assertEquals(messages1[0].payload, "complete");

  // Feed rest of second message
  const messages2 = reader.feed(encoded2.slice(5));
  assertEquals(messages2.length, 1);
  assertEquals(messages2[0].payload, "partial message");
});

Deno.test("MessageReader - handles multiple reads without messages", () => {
  const reader = new MessageReader();
  const msg: WormholeMessage = { type: "data", payload: "hello" };
  const encoded = encodeMessage(msg);

  // Feed byte by byte
  for (let i = 0; i < encoded.length - 1; i++) {
    const messages = reader.feed(encoded.slice(i, i + 1));
    assertEquals(messages.length, 0);
  }

  // Feed last byte
  const messages = reader.feed(encoded.slice(encoded.length - 1));
  assertEquals(messages.length, 1);
});

Deno.test("MessageReader - independent instances don't share state", () => {
  const reader1 = new MessageReader();
  const reader2 = new MessageReader();

  const msg: WormholeMessage = { type: "data", payload: "test" };
  const encoded = encodeMessage(msg);

  // Feed partial to reader1
  reader1.feed(encoded.slice(0, 5));

  // Feed complete to reader2
  const messages2 = reader2.feed(encoded);
  assertEquals(messages2.length, 1);

  // reader1 should still be waiting
  const messages1 = reader1.feed(encoded.slice(5));
  assertEquals(messages1.length, 1);
});

Deno.test("MessageReader - handles large messages", () => {
  const reader = new MessageReader();

  // Create a large payload
  const largePayload = "x".repeat(100000);
  const msg: WormholeMessage = { type: "data", payload: largePayload };
  const encoded = encodeMessage(msg);

  const messages = reader.feed(encoded);

  assertEquals(messages.length, 1);
  assertEquals(messages[0].payload.length, 100000);
});
