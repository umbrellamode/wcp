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

That's it! Your AI agent runs the dev server while you watch the logs
separately.

## Project Setup

### Initialize Your Project

Run `wcp init` to set up your project:

```bash
wcp init
```

This will:

1. Generate `CLAUDE.md` and `AGENTS.md` for AI agents
2. Detect your dev server command
3. Save configuration to `WCP.md`

### Start Your Dev Server

Once initialized, start your dev server with:

```bash
wcp start
```

Or have it auto-start when watching:

```bash
wcp watch
```

### Check Status

See your current configuration and active sessions:

```bash
wcp status
```

### Configuration

The `WCP.md` file stores your project settings in a human-readable format:

```markdown
# WCP.md

This file configures [wcp](https://wcp.dev) for this project.

## Dev Server

**Command:** `npm run dev`

**Source:** package.json

## Configuration

\`\`\`json { "project": { "type": "Node.js", "packageManager": "npm" },
"devServer": { "name": "dev", "command": ["npm", "run", "dev"], "source":
"package.json" } } \`\`\`
```

Edit this file to customize your dev command. The JSON block in the
Configuration section is parsed by wcp.

## Usage

```
wcp init                  Set up project and detect dev command
wcp start                 Start dev server from saved config
wcp watch                 Monitor logs (auto-starts if needed)
wcp status                Show project config and sessions
wcp dev                   Detect and select dev command interactively
wcp <id> -- <command>     Create named session with command
wcp <id>                  Connect to existing session
wcp list                  List active sessions
wcp kill <id>             Close a session
wcp update                Update to latest version
wcp help                  Show help
```

## Examples

```bash
# Initialize project (creates WCP.md)
wcp init

# Start configured dev server
wcp start

# Watch all sessions (auto-starts if needed)
wcp watch

# Check project status
wcp status

# Run a Next.js dev server
wcp 3000 -- npm run dev

# Run with a named identifier
wcp api -- cargo run

# Connect from another terminal
wcp api

# Kill a session
wcp kill api

# List all active sessions
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
│   ├── menu.ts          # Interactive menu
│   └── output.ts        # Output formatting utilities
├── core/                 # Core functionality
│   ├── daemon.ts        # Server/daemon
│   ├── client.ts        # Client connection
│   ├── broadcast.ts     # Message broadcasting
│   ├── process.ts       # Child process handling
│   └── protocol.ts      # Message protocol
└── utils/                # Utilities
    ├── config.ts        # Project configuration
    ├── ring-buffer.ts   # Circular buffer
    └── socket.ts        # Socket management
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
