# Wormhole Monitor - Project Requirements

## Overview

A bidirectional log streaming CLI tool that creates a "wormhole" between AI
coding agents (Claude Code, Cursor, OpenCode) and external terminals. Allows
monitoring background processes like dev servers from multiple terminal sessions
simultaneously.

## Problem Statement

When using AI coding agents like Claude Code or Cursor, there's no way to:

- Run a dev server in the background AND monitor its logs
- Share log streams between the AI agent's terminal and external terminals
- Have late-joining terminals see historical logs

## Solution

A CLI tool that creates Unix domain sockets acting as a central hub for log
streaming. Multiple terminals can connect to the same "wormhole" and all see
identical, real-time log output.

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   Claude Code CLI   │         │   External Terminal │
│   wormhole 3000     │◄───────►│   wormhole 3000     │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           │    ┌───────────────────┐      │
           └───►│   Unix Socket     │◄─────┘
                │   (~/.wormhole/)  │
                │   + Log Buffer    │
                └─────────┬─────────┘
                          │
                          ▼
                ┌───────────────────┐
                │   Child Process   │
                │   (dev server)    │
                └───────────────────┘
```

## Core Features

### 1. Wormhole Creation

- Create a Unix domain socket at `~/.wormhole/wormhole-<port>.sock`
- Accept multiple client connections
- Broadcast data to all connected clients

### 2. Process Piping

- Spawn a child process (e.g., `npm run dev`)
- Capture stdout and stderr
- Broadcast output to all connected wormhole clients
- Also display locally in the originating terminal

### 3. Log Buffer

- Maintain a ring buffer of the last 1000 lines
- Replay buffer to late-joining clients
- Clear visual indicator when replaying vs live

### 4. Bidirectional Communication

- Any connected client can write to the stream
- Written data broadcasts to all other clients
- Enables interactive use cases

### 5. Session Management

- List active wormholes
- Kill/close specific wormholes
- Clean up socket files on exit

## CLI Interface

```bash
# Create wormhole and run command
wormhole <port> -- <command>
wormhole 3000 -- npm run dev

# Connect to existing wormhole
wormhole <port>
wormhole 3000

# List active wormholes
wormhole list

# Close a wormhole
wormhole kill <port>

# Help
wormhole help
```

## Technical Requirements

### Platform

- **Runtime**: Deno (for single-binary compilation)
- **Target OS**: Linux, macOS, Windows
- **Socket Type**: Unix domain sockets (Linux/macOS), Named pipes (Windows)

### Dependencies

- Deno standard library only (`@std/path`, `@std/fs`)
- No external npm packages

### Permissions (Deno)

- `--allow-net` - Unix socket connections
- `--allow-read` - Read socket directory
- `--allow-write` - Create socket files
- `--allow-run` - Spawn child processes
- `--allow-env` - Read HOME environment variable

## Distribution

### Installation Methods

1. **curl installer** (like rams.ai)
   ```bash
   curl -fsSL https://wormhole.dev/install | sh
   ```

2. **Deno install**
   ```bash
   deno install --allow-net --allow-read --allow-write --allow-run --allow-env \
     --name wormhole https://wormhole.dev/cli.ts
   ```

3. **Pre-compiled binaries**
   - GitHub releases for each platform
   - Single executable, no runtime needed

### Compilation Targets

- `x86_64-unknown-linux-gnu`
- `x86_64-apple-darwin`
- `aarch64-apple-darwin` (Apple Silicon)
- `x86_64-pc-windows-msvc`

## User Experience

### Creating a Wormhole

```
$ wormhole 3000 -- npm run dev
✓ Wormhole opened on port 3000
  Socket: /home/user/.wormhole/wormhole-3000.sock

> my-app@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local: http://localhost:3000
```

### Connecting to a Wormhole

```
$ wormhole 3000
Connecting to wormhole 3000...
✓ Connected to wormhole 3000

--- Replaying 15 buffered lines ---
> my-app@1.0.0 dev
> next dev
  ▲ Next.js 14.0.0
  - Local: http://localhost:3000
--- Live stream ---
```

### Listing Wormholes

```
$ wormhole list
Active wormholes:
  • Port 3000
  • Port 8080
```

## Future Enhancements (Out of Scope for v1)

- [ ] TCP support for remote connections
- [ ] Authentication for remote access
- [ ] Web UI for viewing logs
- [ ] MCP server integration for slash commands
- [ ] Log filtering and search
- [ ] Multiple named channels per port
- [ ] Persistent log storage
