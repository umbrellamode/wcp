# AGENTS.md

This file provides guidance to AI coding agents when working with this codebase.

## Project Overview

**@wormhole/cli** - A deno project.

## Development Commands

- **dev**: `deno task dev` - Start development server
- **test**: `deno task test` - Run tests
- **compile**: `deno task compile` - Compile to binary

## Project Structure

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

## Conventions

- TypeScript for type safety
- Deno standard library preferred over npm packages
- Use `deno fmt` for formatting
- Use `deno lint` for linting

## Guidelines

- Read and understand existing code before making changes
- Follow the existing code style and patterns
- Run tests before submitting changes
- Keep changes focused and minimal
