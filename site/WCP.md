# WCP.md

This file configures [wcp](https://wcp.dev) for this project.

## Quick Start

```bash
wcp start   # Start dev server
wcp watch   # Monitor logs (in another terminal)
wcp status  # Show current configuration
```

## Dev Server

**Command:** `deno task dev`

**Source:** deno.json

## Configuration

```json
{
  "project": {
    "type": "Deno"
  },
  "devServer": {
    "name": "dev",
    "command": [
      "deno",
      "task",
      "dev"
    ],
    "source": "deno.json"
  }
}
```

## About

wcp creates Unix domain sockets for sharing terminal output across multiple
processes. Run background dev servers while monitoring logs from external
terminals.

Learn more: https://wcp.dev
