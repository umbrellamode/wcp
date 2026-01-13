/**
 * Message Protocol
 *
 * Format: <4-byte length><payload>
 * - Length is a 32-bit big-endian unsigned integer
 * - Payload is UTF-8 encoded JSON
 *
 * Message Types:
 * - "data": Regular log line (text to broadcast)
 * - "replay-start": Start of historical replay
 * - "replay-end": End of historical replay
 * - "stdin": Data from client to forward to process stdin
 */

export interface WormholeMessage {
  type: "data" | "replay-start" | "replay-end" | "stdin";
  payload: string;
  timestamp?: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Encode a message with length prefix for transmission */
export function encodeMessage(msg: WormholeMessage): Uint8Array {
  const json = JSON.stringify(msg);
  const payload = encoder.encode(json);
  const buffer = new Uint8Array(4 + payload.length);

  // Write 4-byte big-endian length
  const view = new DataView(buffer.buffer);
  view.setUint32(0, payload.length, false);

  // Write payload
  buffer.set(payload, 4);
  return buffer;
}

/**
 * MessageReader - Parses framed messages from a connection stream
 * Handles partial reads and buffering
 */
export class MessageReader {
  private buffer: Uint8Array = new Uint8Array(0);

  /** Feed raw bytes and get complete messages */
  feed(data: Uint8Array): WormholeMessage[] {
    // Append new data to buffer
    const newBuffer = new Uint8Array(this.buffer.length + data.length);
    newBuffer.set(this.buffer);
    newBuffer.set(data, this.buffer.length);
    this.buffer = newBuffer;

    const messages: WormholeMessage[] = [];

    // Extract complete messages
    while (this.buffer.length >= 4) {
      const view = new DataView(
        this.buffer.buffer,
        this.buffer.byteOffset,
        this.buffer.byteLength,
      );
      const length = view.getUint32(0, false);

      if (this.buffer.length < 4 + length) {
        break; // Incomplete message
      }

      const payload = this.buffer.slice(4, 4 + length);
      const json = decoder.decode(payload);
      messages.push(JSON.parse(json));

      // Remove processed data from buffer
      this.buffer = this.buffer.slice(4 + length);
    }

    return messages;
  }
}
