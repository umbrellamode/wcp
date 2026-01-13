import { encodeMessage, type WormholeMessage } from "./protocol.ts";

type ClientConnection = Deno.UnixConn;

/**
 * Broadcaster - Manages connected clients and message distribution
 */
export class Broadcaster {
  private clients: Set<ClientConnection> = new Set();

  /** Add a new client connection */
  add(conn: ClientConnection): void {
    this.clients.add(conn);
  }

  /** Remove a client connection */
  remove(conn: ClientConnection): void {
    this.clients.delete(conn);
    try {
      conn.close();
    } catch {
      // Already closed
    }
  }

  /** Get current client count */
  get count(): number {
    return this.clients.size;
  }

  /** Broadcast a message to all clients */
  async broadcast(msg: WormholeMessage): Promise<void> {
    const encoded = encodeMessage(msg);
    const deadClients: ClientConnection[] = [];

    for (const client of this.clients) {
      try {
        await client.write(encoded);
      } catch {
        // Client disconnected
        deadClients.push(client);
      }
    }

    // Clean up dead clients
    for (const client of deadClients) {
      this.remove(client);
    }
  }

  /** Send a message to a specific client */
  async sendTo(conn: ClientConnection, msg: WormholeMessage): Promise<void> {
    try {
      await conn.write(encodeMessage(msg));
    } catch {
      this.remove(conn);
    }
  }

  /** Close all client connections */
  closeAll(): void {
    for (const client of this.clients) {
      try {
        client.close();
      } catch {
        // Ignore
      }
    }
    this.clients.clear();
  }
}
