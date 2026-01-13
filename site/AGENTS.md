# AGENTS.md

This file provides guidance to AI coding agents when working with this codebase.

## Project Overview

**site** - A deno project.

## Development Commands

- **dev**: `deno task dev` - Start development server
- **start**: `deno task start` - Start the application

## Project Structure

```
├── images
│   ├── claude.png
│   ├── cursor.jpeg
│   ├── OG.png
│   ├── opencode.png
│   └── vscode.jpeg
├── deno.json                 # Deno configuration
├── docs.md
├── launch-article.md
└── main.ts                   # Entry point
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

## Background Processes

Use `wcp` to run dev servers and background processes. This allows you to start
long-running processes while the user monitors logs from an external terminal.

**Commands:**

- `wcp dev` - Auto-detect and start dev server
- `wcp watch` - Monitor logs from another terminal
- `wcp <name> -- <command>` - Start a named process (e.g.,
  `wcp dev -- npm run dev`)
