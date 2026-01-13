import { getSocketPath, socketExists } from "../utils/socket.ts";
import {
  encodeMessage,
  MessageReader,
  type WormholeMessage,
} from "./protocol.ts";

const encoder = new TextEncoder();

// Colors for watch mode - cycle through these for different sessions
const WATCH_COLORS = [
  "\x1b[36m", // cyan
  "\x1b[33m", // yellow
  "\x1b[35m", // magenta
  "\x1b[32m", // green
  "\x1b[34m", // blue
  "\x1b[91m", // bright red
];
const RESET = "\x1b[0m";

/**
 * WcpClient - Connects to an existing wcp session
 */
export class WcpClient {
  private conn: Deno.UnixConn | null = null;
  private running = false;
  private color = "";

  constructor(private port: string) {}

  /** Set a color for prefixed output in watch mode */
  setColor(colorIndex: number): void {
    this.color = WATCH_COLORS[colorIndex % WATCH_COLORS.length];
  }

  /** Connect to the wcp session */
  async connect(): Promise<void> {
    if (!(await socketExists(this.port))) {
      throw new Error(`No wcp session found: ${this.port}`);
    }

    const socketPath = getSocketPath(this.port);

    console.log(`Connecting to wcp ${this.port}...`);

    this.conn = await Deno.connect({
      path: socketPath,
      transport: "unix",
    });

    console.log(`✓ Connected to wcp ${this.port}\n`);

    this.running = true;

    // Start reading messages
    this.readMessages();

    // Start reading stdin for bidirectional communication
    this.readStdin();

    // Handle signals
    this.setupSignalHandlers();
  }

  /** Connect in watch mode (read-only, prefixed output, no exit on disconnect) */
  async connectWatch(): Promise<void> {
    if (!(await socketExists(this.port))) {
      console.log(`${this.color}[${this.port}]${RESET} Session not found`);
      return;
    }

    const socketPath = getSocketPath(this.port);

    try {
      this.conn = await Deno.connect({
        path: socketPath,
        transport: "unix",
      });
    } catch {
      console.log(`${this.color}[${this.port}]${RESET} Failed to connect`);
      return;
    }

    this.running = true;

    // Read messages with prefixed output (no stdin, no signal handlers)
    await this.readMessagesWatch();
  }

  /** Read messages in watch mode with prefixed output */
  private async readMessagesWatch(): Promise<void> {
    if (!this.conn) return;

    const reader = new MessageReader();
    const buffer = new Uint8Array(4096);
    const prefix = `${this.color}[${this.port}]${RESET} `;
    let lineBuffer = "";

    try {
      while (this.running) {
        const bytesRead = await this.conn.read(buffer);
        if (bytesRead === null) {
          // Output any remaining buffered content
          if (lineBuffer) {
            Deno.stdout.writeSync(encoder.encode(prefix + lineBuffer + "\n"));
          }
          console.log(`${this.color}[${this.port}]${RESET} Session closed`);
          break;
        }

        const messages = reader.feed(buffer.slice(0, bytesRead));
        for (const msg of messages) {
          if (msg.type === "data") {
            // Split by lines and prefix each
            const text = lineBuffer + msg.payload;
            const lines = text.split("\n");

            // Keep last incomplete line in buffer
            lineBuffer = lines.pop() || "";

            // Output complete lines with prefix
            for (const line of lines) {
              Deno.stdout.writeSync(encoder.encode(prefix + line + "\n"));
            }
          }
          // Ignore replay-start/replay-end in watch mode
        }
      }
    } catch {
      console.log(`${this.color}[${this.port}]${RESET} Connection lost`);
    } finally {
      try {
        this.conn?.close();
      } catch {
        // Already closed
      }
    }
  }

  /** Read messages from the wcp server */
  private async readMessages(): Promise<void> {
    if (!this.conn) return;

    const reader = new MessageReader();
    const buffer = new Uint8Array(4096);
    let inReplay = false;

    try {
      while (this.running) {
        const bytesRead = await this.conn.read(buffer);
        if (bytesRead === null) {
          console.log("\nSession closed");
          break;
        }

        const messages = reader.feed(buffer.slice(0, bytesRead));
        for (const msg of messages) {
          if (msg.type === "replay-start") {
            const lineCount = parseInt(msg.payload) || 0;
            if (lineCount > 0) {
              console.log(`--- Replaying ${lineCount} buffered lines ---`);
            }
            inReplay = true;
          } else if (msg.type === "replay-end") {
            if (inReplay) {
              console.log("--- Live stream ---\n");
            }
            inReplay = false;
          } else if (msg.type === "data") {
            // Output to terminal
            Deno.stdout.writeSync(encoder.encode(msg.payload));
          }
        }
      }
    } catch {
      console.log("\nConnection lost");
    } finally {
      this.disconnect();
    }
  }

  /** Read from stdin and send to wcp */
  private async readStdin(): Promise<void> {
    const buffer = new Uint8Array(1024);
    const decoder = new TextDecoder();

    try {
      while (this.running) {
        const bytesRead = await Deno.stdin.read(buffer);
        if (bytesRead === null) break;

        const text = decoder.decode(buffer.slice(0, bytesRead));
        await this.send({
          type: "stdin",
          payload: text,
        });
      }
    } catch {
      // Stdin closed
    }
  }

  /** Send a message to the wcp session */
  private async send(msg: WormholeMessage): Promise<void> {
    if (this.conn) {
      try {
        await this.conn.write(encodeMessage(msg));
      } catch {
        // Connection lost
      }
    }
  }

  /** Set up signal handlers */
  private setupSignalHandlers(): void {
    Deno.addSignalListener("SIGINT", () => {
      console.log("\nDisconnecting...");
      this.disconnect();
    });
  }

  /** Disconnect from the wcp session */
  disconnect(): void {
    this.running = false;
    try {
      this.conn?.close();
    } catch {
      // Already closed
    }
    Deno.exit(0);
  }
}
