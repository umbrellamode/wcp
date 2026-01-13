# wcp Documentation

## Installation

### Quick Install

```bash
curl -fsSL https://wcp.dev/install | bash
```

This installs wcp and adds the `/wcp` command to supported AI tools (Claude
Code, Cursor, OpenCode).

### Manual Install with Deno

```bash
deno install -gAf --name wcp https://raw.githubusercontent.com/umbrellamode/wcp/main/mod.ts
```

### Update

```bash
wcp update
```

---

## Commands

### `wcp dev`

Auto-detect your project type and start a dev server.

```bash
wcp dev
```

Detects:

- `package.json` → npm/pnpm/yarn/bun scripts
- `deno.json` → Deno tasks
- `Cargo.toml` → Cargo commands
- `go.mod` → Go commands
- `Makefile` → Make targets
- `docker-compose.yml` → Docker Compose

### `wcp <name> -- <command>`

Create a wormhole and run a command.

```bash
# Start a Next.js dev server
wcp 3000 -- npm run dev

# Start a Rust server
wcp api -- cargo run

# Start any command
wcp logs -- tail -f /var/log/syslog
```

The name can be anything: `dev`, `3000`, `api`, `my-server`.

### `wcp <name>`

Connect to an existing wormhole.

```bash
# Connect to the wormhole named "dev"
wcp dev

# Connect to wormhole "3000"
wcp 3000
```

When you connect, you'll see:

1. Replay of the last 1000 lines of output
2. Live streaming of new output
3. Ability to send input to the process

### `wcp list`

List all active wormholes.

```bash
wcp list
```

Output:

```
Active wcps:
  • Port dev
  • Port 3000
  • Port api (stale)
```

Stale wormholes are sockets that exist but the process has died.

### `wcp kill <name>`

Terminate a wormhole.

```bash
wcp kill dev
```

### `wcp init`

Generate AI agent documentation for your project.

```bash
wcp init
```

Creates or updates:

- `CLAUDE.md` - Guidance for Claude Code
- `AGENTS.md` - Guidance for other AI agents

### `wcp update`

Update wcp to the latest version.

```bash
wcp update
```

### `wcp help`

Show help message.

```bash
wcp help
```

---

## How It Works

### Architecture

```
┌─────────────────┐     Unix Socket      ┌─────────────────┐
│   AI Agent      │ ←─────────────────→  │    wcp daemon   │
│   (Terminal 1)  │                      │                 │
└─────────────────┘                      │  ┌───────────┐  │
                                         │  │  Child    │  │
┌─────────────────┐     Unix Socket      │  │  Process  │  │
│   You           │ ←─────────────────→  │  │ (npm dev) │  │
│   (Terminal 2)  │                      │  └───────────┘  │
└─────────────────┘                      │                 │
                                         │  Ring Buffer   │
┌─────────────────┐     Unix Socket      │  (1000 lines)  │
│   Another User  │ ←─────────────────→  │                 │
│   (Terminal 3)  │                      └─────────────────┘
└─────────────────┘
```

### Data Flow

1. **Daemon starts**: Creates Unix socket at `~/.wormhole/wormhole-<name>.sock`
2. **Process spawns**: Daemon runs your command, captures stdout/stderr
3. **Output buffered**: Last 1000 lines stored in a ring buffer
4. **Clients connect**: Receive replay of buffer, then live stream
5. **Bidirectional**: Clients can send stdin to the child process

### Message Protocol

All messages use a 4-byte big-endian length prefix followed by JSON:

```
┌──────────────┬─────────────────────────────┐
│ Length (4B)  │ JSON Payload                │
└──────────────┴─────────────────────────────┘
```

Message types:

- `data` - Output from the child process
- `stdin` - Input from a client
- `replay-start` - Beginning of history replay
- `replay-end` - End of history replay

---

## Examples

### Development Server

Start a dev server that others can monitor:

```bash
# Terminal 1 (AI Agent)
wcp dev -- npm run dev

# Terminal 2 (You)
wcp dev
```

### Named Sessions

Use descriptive names for multiple services:

```bash
# Start backend
wcp backend -- cargo run

# Start frontend
wcp frontend -- npm run dev

# Start database
wcp db -- docker-compose up postgres
```

### Monitoring Logs

Watch log files through wcp:

```bash
# Terminal 1
wcp logs -- tail -f /var/log/app.log

# Terminal 2
wcp logs
```

---

## Configuration

### Socket Location

Sockets are stored in `~/.wormhole/`:

```
~/.wormhole/
├── wormhole-dev.sock
├── wormhole-3000.sock
└── wormhole-api.sock
```

### Buffer Size

The ring buffer holds the last 1000 lines of output. This is currently not
configurable.

---

## Troubleshooting

### "Wormhole already exists"

A socket file exists for that name. Either:

- Connect to it: `wcp <name>`
- Kill it first: `wcp kill <name>`

### "Connection refused" or "stale" socket

The daemon died but the socket file remains. Kill and restart:

```bash
wcp kill <name>
wcp <name> -- <command>
```

### Socket permission errors

Ensure `~/.wormhole/` is writable:

```bash
chmod 700 ~/.wormhole
```

---

## For AI Agents

When using wcp from an AI coding agent:

1. **Detect the project type** before running
2. **Use `wcp dev`** for auto-detection when possible
3. **Tell the user** how to connect: "Run `wcp dev` in another terminal"
4. **Check for existing wormholes** with `wcp list`
