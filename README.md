# wcp

> Bidirectional log streaming for AI coding agents

wcp (wormhole control protocol) creates Unix domain sockets for sharing terminal
output across multiple processes. Run background dev servers while monitoring
logs from external terminals.

## Quick Start

### 1. Install

```bash
curl -fsSL https://wcp.dev/install | bash
```

Or with Deno:

```bash
deno install -gAf --name wcp https://raw.githubusercontent.com/umbrellamode/wcp/main/mod.ts
```

### 2. Start your dev server in the background

In your AI coding session, run:

```bash
wcp dev
```

This auto-detects your project and starts the dev server in a wormhole.

### 3. Monitor logs in another terminal

```bash
wcp watch
```

That's it! Your AI agent runs the dev server while you watch the logs separately.

## Usage

```
wcp dev                   Detect project and start dev server
wcp watch                 Stream logs from all active sessions
wcp <port> -- <command>   Create wormhole and run command
wcp <port>                Connect to existing wormhole
wcp list                  List active wormholes
wcp kill <port>           Close a wormhole
wcp init                  Generate CLAUDE.md and AGENTS.md
wcp update                Update to latest version
wcp help                  Show help
```

## Examples

```bash
# Run a Next.js dev server
wcp 3000 -- npm run dev

# Run with a named identifier
wcp api -- cargo run

# Connect from another terminal
wcp api

# Watch all active sessions
wcp watch

# Kill a wormhole
wcp kill api

# List all active wormholes
wcp list
```

## How It Works

1. **Daemon** spawns your command and captures stdout/stderr
2. Output is stored in a ring buffer and broadcast to all clients
3. **Clients** connect and receive replay of recent output, then live stream
4. Clients can send stdin back to the child process

All communication uses Unix domain sockets at
`~/.wormhole/wormhole-<port>.sock`.

## Local Development

### Prerequisites

- [Deno](https://deno.land/) v2.x or later

### Setup

```bash
# Clone the repository
git clone https://github.com/umbrellamode/wcp.git
cd wcp
```

### Running Locally

```bash
# Run in development mode
deno task dev

# Run with arguments
deno task dev 3000 -- echo "hello"
```

### Testing

```bash
# Run all tests
deno task test

# Run tests with watch mode
deno test --allow-all --watch
```

### Code Quality

```bash
# Format code
deno fmt

# Check formatting (CI mode)
deno fmt --check

# Lint code
deno lint
```

### Building

```bash
# Compile to a standalone binary
deno task compile

# The binary will be created as ./wormhole
./wormhole help
```

## Project Structure

```
mod.ts                    # Entry point
src/
├── cli/                  # Command-line interface
│   ├── args.ts          # Argument parsing
│   ├── commands.ts      # Command handlers
│   ├── animation.ts     # ASCII animations
│   ├── detect.ts        # Project detection
│   ├── init.ts          # Init command
│   └── menu.ts          # Interactive menu
├── core/                 # Core functionality
│   ├── daemon.ts        # Server/daemon
│   ├── client.ts        # Client connection
│   ├── broadcast.ts     # Message broadcasting
│   ├── process.ts       # Child process handling
│   └── protocol.ts      # Message protocol
└── utils/                # Utilities
    ├── ring-buffer.ts   # Circular buffer
    └── socket.ts        # Socket management
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
