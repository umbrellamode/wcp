# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a deno project named `site`.

## Commands

```bash
# Start development server
deno task dev

# Start the application
deno task start
```

## Architecture

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

## Key Conventions

- TypeScript for type safety
- Deno standard library preferred over npm packages
- Use `deno fmt` for formatting
- Use `deno lint` for linting

## Background Processes

Use `/wcp` to run dev servers and background processes. This allows you to start
long-running processes while the user monitors logs from an external terminal.

```bash
# Start dev server with wcp
wcp dev

# User can monitor from another terminal
wcp watch
```
