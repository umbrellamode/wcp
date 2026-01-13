/**
 * ProcessManager - Spawns child process and captures output streams
 */
export class ProcessManager {
  private process: Deno.ChildProcess | null = null;
  private stdinWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;

  /** Callback for process output */
  onOutput: ((data: Uint8Array, source: "stdout" | "stderr") => void) | null =
    null;

  /** Callback for process exit */
  onExit: ((code: number) => void) | null = null;

  /**
   * Spawn a command with piped streams
   * @param cmdArgs - Full command array, e.g., ["npm", "run", "dev"]
   */
  spawn(cmdArgs: string[]): void {
    const [cmd, ...args] = cmdArgs;

    const command = new Deno.Command(cmd, {
      args,
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    this.process = command.spawn();
    this.stdinWriter = this.process.stdin.getWriter();

    // Start reading stdout
    this.readStream(this.process.stdout, "stdout");

    // Start reading stderr
    this.readStream(this.process.stderr, "stderr");

    // Wait for process to exit
    this.process.status.then((status) => {
      this.onExit?.(status.code);
    });
  }

  /** Read from a stream and emit output events */
  private async readStream(
    stream: ReadableStream<Uint8Array>,
    source: "stdout" | "stderr",
  ): Promise<void> {
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          this.onOutput?.(value, source);
        }
      }
    } catch {
      // Stream closed
    } finally {
      reader.releaseLock();
    }
  }

  /** Write data to the process stdin */
  async writeStdin(data: Uint8Array): Promise<void> {
    if (this.stdinWriter) {
      await this.stdinWriter.write(data);
    }
  }

  /** Kill the process */
  kill(signal: Deno.Signal = "SIGTERM"): void {
    try {
      this.process?.kill(signal);
    } catch {
      // Process may already be dead
    }
  }

  /** Close stdin stream */
  async closeStdin(): Promise<void> {
    if (this.stdinWriter) {
      await this.stdinWriter.close();
      this.stdinWriter = null;
    }
  }
}
