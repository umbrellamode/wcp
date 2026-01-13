import { getSocketPath, socketExists } from "../utils/socket.ts";
import {
  encodeMessage,
  MessageReader,
  type WormholeMessage,
} from "./protocol.ts";

const encoder = new TextEncoder();

/**
 * WcpClient - Connects to an existing wcp session
 */
export class WcpClient {
  private conn: Deno.UnixConn | null = null;
  private running = false;

  constructor(private port: string) {}

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
