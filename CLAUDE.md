# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Wormhole (wcp) is a bidirectional log streaming CLI tool built with Deno. It
creates Unix domain sockets for sharing terminal output across multiple
processes, enabling AI coding agents to run background processes while
monitoring logs from external terminals.

**Data Flow:**

1. Daemon spawns child process and captures stdout/stderr
2. Output is stored in ring buffer and broadcast to all clients
3. New clients receive replay of buffered history, then live stream
4. Clients can send stdin data back to the child process

**Message Protocol:** All socket messages use a 4-byte big-endian length prefix
followed by JSON payload. Message types: `data`, `replay-start`, `replay-end`,
`stdin`.

## Commands

```bash
# Start development server
deno task dev

# Run tests
deno task test

# Compile to binary
deno task compile
```

## Architecture

```
├── site
│   ├── deno.json             # Deno configuration
│   └── main.ts               # Entry point
├── src                       # Source code
│   ├── cli                   # Command-line interface
│   │   ├── animation.ts
│   │   ├── args.ts
│   │   ├── commands.ts
│   │   ├── detect.ts
│   │   ├── init.ts
│   │   └── menu.ts
│   ├── core                  # Core functionality
│   │   ├── broadcast.ts
│   │   ├── client.ts
│   │   ├── daemon.ts
│   │   ├── process.ts
│   │   └── protocol.ts
│   └── utils                 # Utility functions
│       ├── ring-buffer.ts
│       └── socket.ts
├── tests                     # Test files
│   ├── args.test.ts
│   ├── integration.test.ts
│   ├── protocol.test.ts
│   ├── ring-buffer.test.ts
│   └── socket.test.ts
├── AGENTS.md                 # AI agent guidance
├── CLAUDE.md                 # AI agent guidance
├── deno.json                 # Deno configuration
├── install.sh
├── mod.ts                    # Entry point
├── wcp.md
├── wormhole
└── wormhole-requirements.md
```

## Key Conventions

- TypeScript for type safety
- Deno standard library preferred over npm packages
- Use `deno fmt` for formatting
- Use `deno lint` for linting
