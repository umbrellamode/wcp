import { RingBuffer } from "../utils/ring-buffer.ts";
import { ensureWcpDir, getSocketPath, removeSocket } from "../utils/socket.ts";
import { Broadcaster } from "./broadcast.ts";
import { ProcessManager } from "./process.ts";
import { MessageReader, type WormholeMessage } from "./protocol.ts";

const BUFFER_SIZE = 1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface DaemonOptions {
  port: string;
  command: string[];
}

/**
 * WcpDaemon - Main server that manages:
 * - Unix socket listener
 * - Child process spawning
 * - Client connections and broadcasting
 * - Ring buffer for historical replay
 */
export class WcpDaemon {
  private listener: Deno.UnixListener | null = null;
  private broadcaster = new Broadcaster();
  private processManager = new ProcessManager();
  private ringBuffer = new RingBuffer<WormholeMessage>(BUFFER_SIZE);
  private port: string;
  private running = false;

  constructor(private options: DaemonOptions) {
    this.port = options.port;
  }

  /** Start the daemon */
  async start(): Promise<void> {
    await ensureWcpDir();

    const socketPath = getSocketPath(this.port);

    // Remove existing socket if present
    await removeSocket(this.port);

    // Create Unix socket listener
    this.listener = Deno.listen({
      path: socketPath,
      transport: "unix",
    });

    this.running = true;
    console.log(`✓ wcp opened: ${this.port}`);
    console.log(`  Socket: ${socketPath}\n`);

    // Set up process output handling
    this.processManager.onOutput = (data, _source) => {
      this.handleProcessOutput(data);
    };

    this.processManager.onExit = (code) => {
      console.log(`\nProcess exited with code ${code}`);
      this.shutdown();
    };

    // Spawn the child process
    this.processManager.spawn(this.options.command);

    // Handle graceful shutdown
    this.setupSignalHandlers();

    // Accept client connections
    this.acceptConnections();
  }

  /** Handle output from the child process */
  private handleProcessOutput(data: Uint8Array): void {
    // Write to local terminal
    Deno.stdout.writeSync(data);

    // Split into lines and buffer each line
    const text = decoder.decode(data);
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      if (line.length > 0) {
        const msg: WormholeMessage = {
          type: "data",
          payload: line + "\n",
          timestamp: Date.now(),
        };
        this.ringBuffer.push(msg);
      }
    }

    // Broadcast raw data to all clients for real-time streaming
    const msg: WormholeMessage = {
      type: "data",
      payload: text,
      timestamp: Date.now(),
    };
    this.broadcaster.broadcast(msg);
  }

  /** Accept incoming client connections */
  private async acceptConnections(): Promise<void> {
    if (!this.listener) return;

    try {
      for await (const conn of this.listener) {
        this.handleClient(conn);
      }
    } catch {
      // Listener closed
    }
  }

  /** Handle a single client connection */
  private async handleClient(conn: Deno.UnixConn): Promise<void> {
    // Send historical replay
    await this.broadcaster.sendTo(conn, {
      type: "replay-start",
      payload: `${this.ringBuffer.size()}`,
    });

    for (const msg of this.ringBuffer.toArray()) {
      await this.broadcaster.sendTo(conn, msg);
    }

    await this.broadcaster.sendTo(conn, {
      type: "replay-end",
      payload: "",
    });

    // Add to active clients
    this.broadcaster.add(conn);

    // Read incoming messages from this client
    const reader = new MessageReader();
    const buffer = new Uint8Array(4096);

    try {
      while (this.running) {
        const bytesRead = await conn.read(buffer);
        if (bytesRead === null) break;

        const messages = reader.feed(buffer.slice(0, bytesRead));
        for (const msg of messages) {
          await this.handleClientMessage(conn, msg);
        }
      }
    } catch {
      // Client disconnected
    } finally {
      this.broadcaster.remove(conn);
    }
  }

  /** Handle a message from a client */
  private async handleClientMessage(
    _conn: Deno.UnixConn,
    msg: WormholeMessage,
  ): Promise<void> {
    if (msg.type === "stdin") {
      // Forward to process stdin
      await this.processManager.writeStdin(encoder.encode(msg.payload));
    } else if (msg.type === "data") {
      // Broadcast to all other clients
      this.broadcaster.broadcast(msg);
      // Also add to buffer
      this.ringBuffer.push(msg);
    }
  }

  /** Set up signal handlers for graceful shutdown */
  private setupSignalHandlers(): void {
    const signals: Deno.Signal[] = ["SIGINT", "SIGTERM"];

    for (const signal of signals) {
      Deno.addSignalListener(signal, () => {
        console.log(`\nReceived ${signal}, shutting down...`);
        this.shutdown();
      });
    }
  }

  /** Shut down the daemon */
  async shutdown(): Promise<void> {
    if (!this.running) return;
    this.running = false;

    // Kill child process
    this.processManager.kill();

    // Close all client connections
    this.broadcaster.closeAll();

    // Close listener
    try {
      this.listener?.close();
    } catch {
      // Already closed
    }

    // Remove socket file
    await removeSocket(this.port);

    Deno.exit(0);
  }
}
