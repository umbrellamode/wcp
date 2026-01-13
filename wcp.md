# wcp

Use wcp to run background processes (dev servers, builds, watchers) while
letting the user monitor logs from external terminals.

## When to use

- Starting a dev server that needs to keep running
- Running any long-lived process that produces logs
- When the user wants to monitor output from another terminal

## Detect the dev command

Before running wcp, detect the project type and dev command:

| File                 | Dev Command                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `package.json`       | Check `scripts.dev` or `scripts.start`. Use `npm run dev`, `pnpm dev`, `yarn dev`, or `bun dev` based on lockfile |
| `deno.json`          | Check `tasks.dev`. Use `deno task dev`                                                                            |
| `Cargo.toml`         | Use `cargo run` or `cargo watch -x run`                                                                           |
| `go.mod`             | Use `go run .` or `air` if available                                                                              |
| `Makefile`           | Check for `dev` target. Use `make dev`                                                                            |
| `docker-compose.yml` | Use `docker-compose up`                                                                                           |

**Lockfile detection for Node.js:**

- `pnpm-lock.yaml` → `pnpm`
- `yarn.lock` → `yarn`
- `bun.lockb` → `bun`
- `package-lock.json` or none → `npm`

## Usage

```bash
# Auto-detect and select dev command
wcp dev

# Start a process (creates the socket)
wcp <name> -- <command>
wcp dev -- npm run dev
wcp dev -- deno task dev
wcp dev -- cargo watch -x run

# Connect to an existing session (from another terminal)
wcp <name>

# List active sessions
wcp list

# Kill a session
wcp kill <name>
```

## Example workflow

1. Run `wcp dev` to auto-detect and start the dev server
2. Tell the user: "I've started the dev server. Run `wcp dev` in another
   terminal to monitor the logs."

## Key points

- The name can be anything: `dev`, `server`, `3000`, `my-app`
- Late-joining terminals see the last 1000 lines of history
- All connected terminals see the same live output
- Socket is at `~/.wcp/wcp-<name>.sock`
