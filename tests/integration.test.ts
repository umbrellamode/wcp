import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import {
  encodeMessage,
  MessageReader,
  type WormholeMessage,
} from "../src/core/protocol.ts";
import {
  ensureWcpDir,
  getSocketPath,
  removeSocket,
} from "../src/utils/socket.ts";
import { RingBuffer } from "../src/utils/ring-buffer.ts";

// Integration test: Protocol + RingBuffer working together
Deno.test("Integration - RingBuffer stores WormholeMessages correctly", () => {
  const buffer = new RingBuffer<WormholeMessage>(100);

  // Add various message types
  buffer.push({ type: "replay-start", payload: "100" });
  buffer.push({ type: "data", payload: "line 1", timestamp: 1000 });
  buffer.push({ type: "data", payload: "line 2", timestamp: 2000 });
  buffer.push({ type: "replay-end", payload: "" });

  const messages = buffer.toArray();
  assertEquals(messages.length, 4);
  assertEquals(messages[0].type, "replay-start");
  assertEquals(messages[1].payload, "line 1");
  assertEquals(messages[2].payload, "line 2");
  assertEquals(messages[3].type, "replay-end");
});

// Integration test: Encode + Decode round-trip
Deno.test("Integration - Message encode/decode round-trip", () => {
  const originalMessages: WormholeMessage[] = [
    { type: "replay-start", payload: "50" },
    { type: "data", payload: "Hello World", timestamp: Date.now() },
    {
      type: "data",
      payload: "Line with unicode 日本語 🎉",
      timestamp: Date.now(),
    },
    { type: "stdin", payload: "user input\n" },
    { type: "replay-end", payload: "" },
  ];

  const reader = new MessageReader();

  // Encode all messages
  const encodedBuffers = originalMessages.map(encodeMessage);

  // Combine into single buffer (simulating network transmission)
  const totalLength = encodedBuffers.reduce((acc, buf) => acc + buf.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of encodedBuffers) {
    combined.set(buf, offset);
    offset += buf.length;
  }

  // Decode
  const decoded = reader.feed(combined);

  // Verify
  assertEquals(decoded.length, originalMessages.length);
  for (let i = 0; i < originalMessages.length; i++) {
    assertEquals(decoded[i].type, originalMessages[i].type);
    assertEquals(decoded[i].payload, originalMessages[i].payload);
  }
});

// Integration test: Simulated client/server message exchange
Deno.test("Integration - Simulated message exchange", () => {
  // Simulate server-side buffer
  const serverBuffer = new RingBuffer<WormholeMessage>(1000);

  // Server receives process output
  const processLines = [
    "> starting server...",
    "Listening on port 3000",
    "Connected to database",
  ];

  for (const line of processLines) {
    serverBuffer.push({
      type: "data",
      payload: line + "\n",
      timestamp: Date.now(),
    });
  }

  // Simulate new client connecting
  const clientReader = new MessageReader();
  const clientReceived: WormholeMessage[] = [];

  // Server sends replay start
  const replayStart = encodeMessage({
    type: "replay-start",
    payload: String(serverBuffer.size()),
  });
  clientReceived.push(...clientReader.feed(replayStart));

  // Server sends buffered messages
  for (const msg of serverBuffer.toArray()) {
    const encoded = encodeMessage(msg);
    clientReceived.push(...clientReader.feed(encoded));
  }

  // Server sends replay end
  const replayEnd = encodeMessage({
    type: "replay-end",
    payload: "",
  });
  clientReceived.push(...clientReader.feed(replayEnd));

  // Verify client received everything
  assertEquals(clientReceived.length, 5); // start + 3 lines + end
  assertEquals(clientReceived[0].type, "replay-start");
  assertEquals(clientReceived[0].payload, "3");
  assertEquals(clientReceived[1].payload, processLines[0] + "\n");
  assertEquals(clientReceived[2].payload, processLines[1] + "\n");
  assertEquals(clientReceived[3].payload, processLines[2] + "\n");
  assertEquals(clientReceived[4].type, "replay-end");
});

// Integration test: Buffer overflow during replay
Deno.test("Integration - Buffer overflow preserves recent messages", () => {
  const buffer = new RingBuffer<WormholeMessage>(5);

  // Add more messages than capacity
  for (let i = 0; i < 10; i++) {
    buffer.push({
      type: "data",
      payload: `message ${i}`,
      timestamp: i * 1000,
    });
  }

  // Encode and decode the buffered messages
  const reader = new MessageReader();
  const messages = buffer.toArray();

  // Should only have last 5 messages
  assertEquals(messages.length, 5);
  assertEquals(messages[0].payload, "message 5");
  assertEquals(messages[4].payload, "message 9");

  // Verify they encode/decode correctly
  for (const msg of messages) {
    const encoded = encodeMessage(msg);
    const decoded = reader.feed(encoded);
    assertEquals(decoded.length, 1);
    assertEquals(decoded[0].payload, msg.payload);
  }
});

// Integration test: Chunked message delivery
Deno.test("Integration - Chunked delivery simulation", () => {
  const messages: WormholeMessage[] = [
    { type: "data", payload: "first message" },
    { type: "data", payload: "second message" },
    { type: "data", payload: "third message" },
  ];

  // Encode all
  const encoded = messages.map(encodeMessage);
  const combined = new Uint8Array(
    encoded.reduce((acc, buf) => acc + buf.length, 0),
  );
  let offset = 0;
  for (const buf of encoded) {
    combined.set(buf, offset);
    offset += buf.length;
  }

  // Simulate receiving in random-sized chunks
  const reader = new MessageReader();
  const received: WormholeMessage[] = [];
  const chunkSizes = [3, 7, 15, 2, 100]; // Various chunk sizes

  let pos = 0;
  for (const size of chunkSizes) {
    if (pos >= combined.length) break;
    const chunk = combined.slice(pos, Math.min(pos + size, combined.length));
    received.push(...reader.feed(chunk));
    pos += size;
  }

  // Feed remaining if any
  if (pos < combined.length) {
    received.push(...reader.feed(combined.slice(pos)));
  }

  assertEquals(received.length, 3);
  assertEquals(received[0].payload, "first message");
  assertEquals(received[1].payload, "second message");
  assertEquals(received[2].payload, "third message");
});

// Integration test: Socket utilities with real filesystem
Deno.test("Integration - Socket lifecycle", async () => {
  await ensureWcpDir();

  const testPort = `integration-test-${Date.now()}`;
  const socketPath = getSocketPath(testPort);

  // Socket shouldn't exist initially
  try {
    await Deno.stat(socketPath);
    throw new Error("Socket should not exist");
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }

  // Create a dummy socket file
  await Deno.writeTextFile(socketPath, "");

  // Verify it exists
  const stat = await Deno.stat(socketPath);
  assertEquals(stat.isFile, true);

  // Remove it
  await removeSocket(testPort);

  // Verify it's gone
  try {
    await Deno.stat(socketPath);
    throw new Error("Socket should have been removed");
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }
});

// Integration test: Full replay scenario
Deno.test("Integration - Full replay scenario", () => {
  // Setup: Server has been running and has buffered output
  const serverBuffer = new RingBuffer<WormholeMessage>(1000);
  const serverReader = new MessageReader();

  // Simulate 50 lines of output
  for (let i = 0; i < 50; i++) {
    serverBuffer.push({
      type: "data",
      payload: `[${new Date().toISOString()}] Log line ${i + 1}\n`,
      timestamp: Date.now(),
    });
  }

  // New client connects
  const clientReader = new MessageReader();
  const clientOutput: string[] = [];

  // Server sends replay sequence
  const allServerMessages: Uint8Array[] = [];

  // 1. Replay start
  allServerMessages.push(
    encodeMessage({
      type: "replay-start",
      payload: String(serverBuffer.size()),
    }),
  );

  // 2. All buffered messages
  for (const msg of serverBuffer.toArray()) {
    allServerMessages.push(encodeMessage(msg));
  }

  // 3. Replay end
  allServerMessages.push(
    encodeMessage({
      type: "replay-end",
      payload: "",
    }),
  );

  // Combine and send in chunks (simulating network)
  const totalSize = allServerMessages.reduce((acc, b) => acc + b.length, 0);
  const networkBuffer = new Uint8Array(totalSize);
  let pos = 0;
  for (const msg of allServerMessages) {
    networkBuffer.set(msg, pos);
    pos += msg.length;
  }

  // Client receives in 1KB chunks
  let receivedCount = 0;
  let inReplay = false;
  for (let i = 0; i < networkBuffer.length; i += 1024) {
    const chunk = networkBuffer.slice(
      i,
      Math.min(i + 1024, networkBuffer.length),
    );
    const messages = clientReader.feed(chunk);

    for (const msg of messages) {
      if (msg.type === "replay-start") {
        inReplay = true;
        clientOutput.push(`--- Replaying ${msg.payload} lines ---`);
      } else if (msg.type === "replay-end") {
        inReplay = false;
        clientOutput.push("--- Live stream ---");
      } else if (msg.type === "data") {
        clientOutput.push(msg.payload);
        receivedCount++;
      }
    }
  }

  // Verify
  assertEquals(receivedCount, 50);
  assertStringIncludes(clientOutput[0], "Replaying 50 lines");
  assertEquals(clientOutput[clientOutput.length - 1], "--- Live stream ---");
});
