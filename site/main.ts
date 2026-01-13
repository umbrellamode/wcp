const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>wcp - bidirectional log streaming for AI agents</title>
  <meta name="description" content="Share terminal output between AI coding agents and external terminals. Monitor dev servers from anywhere.">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: #000;
      color: #fff;
      font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
      font-size: 14px;
      line-height: 1.6;
      padding: 3rem 1.5rem;
      max-width: 720px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    .tagline {
      color: #888;
      margin-bottom: 2.5rem;
    }
    .logos {
      display: flex;
      gap: 1rem;
      margin-bottom: 3rem;
      flex-wrap: wrap;
    }
    .logos a {
      color: #888;
      text-decoration: none;
      padding: 0.4rem 0.8rem;
      border: 1px solid #333;
      border-radius: 4px;
      font-size: 12px;
      transition: all 0.2s;
    }
    .logos a:hover {
      color: #fff;
      border-color: #666;
    }
    .install {
      background: #111;
      border: 1px solid #333;
      border-radius: 6px;
      padding: 1rem 1.25rem;
      margin-bottom: 3rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .install code {
      color: #0f0;
    }
    .install button {
      background: transparent;
      border: 1px solid #333;
      color: #888;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      transition: all 0.2s;
    }
    .install button:hover {
      color: #fff;
      border-color: #666;
    }
    section {
      margin-bottom: 2.5rem;
    }
    h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    p, li {
      color: #aaa;
    }
    ul {
      list-style: none;
      padding-left: 0;
    }
    li {
      padding-left: 1.2rem;
      position: relative;
      margin-bottom: 0.5rem;
    }
    li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #555;
    }
    .example {
      background: #0a0a0a;
      border: 1px solid #222;
      border-radius: 6px;
      padding: 1.25rem;
      margin-top: 1rem;
      overflow-x: auto;
    }
    .example .header {
      color: #666;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #222;
    }
    .example pre {
      font-family: inherit;
      font-size: 13px;
      line-height: 1.5;
    }
    .dim { color: #555; }
    .green { color: #0f0; }
    .yellow { color: #ff0; }
    .cyan { color: #0ff; }
    .gray { color: #888; }
    footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid #222;
      color: #555;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    footer a {
      color: #555;
      text-decoration: none;
    }
    footer a:hover {
      color: #888;
    }
  </style>
</head>
<body>
  <h1>/wcp</h1>
  <p class="tagline">bidirectional log streaming for AI coding agents</p>

  <div class="logos">
    <a href="/docs">Documentation</a>
    <a href="https://github.com/umbrellamode/wcp" target="_blank">GitHub</a>
  </div>

  <div class="install">
    <code>$ curl -fsSL https://wcp.dev/install | bash</code>
    <button onclick="navigator.clipboard.writeText('curl -fsSL https://wcp.dev/install | bash')">Copy</button>
  </div>

  <section>
    <h2>The Problem</h2>
    <ul>
      <li>AI agents run dev servers but you can't see the logs</li>
      <li>No way to monitor background processes from external terminals</li>
      <li>Joining late means missing important output</li>
    </ul>
  </section>

  <section>
    <h2>The Solution</h2>
    <p>wcp creates a Unix socket that broadcasts output to all connected terminals. Late joiners see the last 1000 lines of history.</p>
  </section>

  <section>
    <h2>Usage</h2>
    <div class="example">
      <div class="header">═══════════════════════════════════════════ TERMINAL 1 (AI Agent)</div>
      <pre><span class="dim">$</span> <span class="green">wcp dev -- npm run dev</span>
<span class="cyan">✓ wcp opened: dev</span>
<span class="dim">  Socket: ~/.wcp/wcp-dev.sock</span>

<span class="gray">> my-app@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local: http://localhost:3000</span></pre>
    </div>

    <div class="example">
      <div class="header">═══════════════════════════════════════════ TERMINAL 2 (You)</div>
      <pre><span class="dim">$</span> <span class="green">wcp dev</span>
<span class="cyan">✓ Connected to wcp dev</span>

<span class="yellow">--- Replaying 12 buffered lines ---</span>
<span class="gray">> my-app@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local: http://localhost:3000</span>
<span class="yellow">--- Live stream ---</span></pre>
    </div>
  </section>

  <section>
    <h2>Commands</h2>
    <ul>
      <li><code>wcp dev</code> — auto-detect and start dev server</li>
      <li><code>wcp &lt;name&gt; -- &lt;cmd&gt;</code> — start a process</li>
      <li><code>wcp &lt;name&gt;</code> — connect to existing session</li>
      <li><code>wcp list</code> — show active sessions</li>
      <li><code>wcp kill &lt;name&gt;</code> — terminate a session</li>
    </ul>
  </section>

  <footer>
    <span>© 2025 wcp</span>
    <div>
      <a href="https://github.com/umbrellamode/wcp">GitHub</a>
    </div>
  </footer>
</body>
</html>`;

const wcpMd = `# wcp

Use wcp to run background processes (dev servers, builds, watchers) while letting the user monitor logs from external terminals.

## When to use

- Starting a dev server that needs to keep running
- Running any long-lived process that produces logs
- When the user wants to monitor output from another terminal

## Detect the dev command

Before running wcp, detect the project type and dev command:

| File | Dev Command |
|------|-------------|
| \`package.json\` | Check \`scripts.dev\` or \`scripts.start\`. Use \`npm run dev\`, \`pnpm dev\`, \`yarn dev\`, or \`bun dev\` based on lockfile |
| \`deno.json\` | Check \`tasks.dev\`. Use \`deno task dev\` |
| \`Cargo.toml\` | Use \`cargo run\` or \`cargo watch -x run\` |
| \`go.mod\` | Use \`go run .\` or \`air\` if available |
| \`Makefile\` | Check for \`dev\` target. Use \`make dev\` |
| \`docker-compose.yml\` | Use \`docker-compose up\` |

**Lockfile detection for Node.js:**
- \`pnpm-lock.yaml\` → \`pnpm\`
- \`yarn.lock\` → \`yarn\`
- \`bun.lockb\` → \`bun\`
- \`package-lock.json\` or none → \`npm\`

## Usage

\`\`\`bash
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
\`\`\`

## Example workflow

1. Run \`wcp dev\` to auto-detect and start the dev server
2. Tell the user: "I've started the dev server. Run \`wcp dev\` in another terminal to monitor the logs."

## Key points

- The name can be anything: \`dev\`, \`server\`, \`3000\`, \`my-app\`
- Late-joining terminals see the last 1000 lines of history
- All connected terminals see the same live output
- Socket is at \`~/.wcp/wcp-<name>.sock\`
`;

const installSh = `#!/bin/bash

# wcp installer
# https://wcp.dev

set -e

WCP_URL="https://wcp.dev/wcp.md"
SOURCE_URL="https://raw.githubusercontent.com/umbrellamode/wcp/main/mod.ts"

echo ""
echo " _  _  _ ___ ___"
echo "| || || | __| _ \\\\"
echo "| | V V | _||  _/"
echo " \\\\_/\\\\_/ |___|_|"
echo ""

# Check for Deno
if ! command -v deno &> /dev/null; then
  echo "Deno not found. Installing Deno first..."
  curl -fsSL https://deno.land/install.sh | sh
  export PATH="$HOME/.deno/bin:$PATH"
fi

echo "Installing wcp..."
deno install -gAf --name wcp "$SOURCE_URL"
echo "✓ Installed wcp"

# Install AI tool commands
echo ""
echo "Installing AI tool commands..."

installed=0

# Claude Code
if [ -d "$HOME/.claude" ]; then
  mkdir -p "$HOME/.claude/commands"
  curl -sL -o "$HOME/.claude/commands/wcp.md" "$WCP_URL"
  echo "✓ Installed /wcp for Claude Code"
  installed=$((installed + 1))
fi

# Cursor
if [ -d "$HOME/.cursor" ]; then
  mkdir -p "$HOME/.cursor/commands"
  curl -sL -o "$HOME/.cursor/commands/wcp.md" "$WCP_URL"
  echo "✓ Installed /wcp for Cursor"
  installed=$((installed + 1))
fi

# OpenCode
if command -v opencode &> /dev/null || [ -d "$HOME/.config/opencode" ]; then
  mkdir -p "$HOME/.config/opencode/command"
  curl -sL -o "$HOME/.config/opencode/command/wcp.md" "$WCP_URL"
  echo "✓ Installed /wcp for OpenCode"
  installed=$((installed + 1))
fi

if [ $installed -eq 0 ]; then
  echo "  No AI tools detected (Claude Code, Cursor, OpenCode)"
fi

echo ""
echo "Done! Run 'wcp dev' to get started."
`;

// Simple markdown to HTML converter
function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML first
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(
    />/g,
    "&gt;",
  );

  // Code blocks (must come before inline code)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : "";
    return `<pre><code${langClass}>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Paragraphs (lines not already wrapped)
  const lines = html.split("\n");
  const result: string[] = [];
  let inPre = false;

  for (const line of lines) {
    if (line.includes("<pre>")) inPre = true;
    if (line.includes("</pre>")) inPre = false;

    if (
      !inPre &&
      line.trim() &&
      !line.startsWith("<h") &&
      !line.startsWith("<ul") &&
      !line.startsWith("<li") &&
      !line.startsWith("<hr") &&
      !line.startsWith("<pre") &&
      !line.startsWith("</")
    ) {
      result.push(`<p>${line}</p>`);
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

const docsStyle = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 16px;
    line-height: 1.7;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  a { color: #58a6ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 2rem 0 1rem;
    color: #fff;
    border-bottom: 1px solid #333;
    padding-bottom: 0.5rem;
  }
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 2.5rem 0 1rem;
    color: #fff;
  }
  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 1.5rem 0 0.75rem;
    color: #ccc;
  }
  p { margin: 0.75rem 0; color: #b0b0b0; }
  ul { margin: 0.75rem 0; padding-left: 1.5rem; }
  li { margin: 0.4rem 0; color: #b0b0b0; }
  hr {
    border: none;
    border-top: 1px solid #333;
    margin: 2.5rem 0;
  }
  pre {
    background: #161616;
    border: 1px solid #2a2a2a;
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
  code {
    font-family: "SF Mono", "Fira Code", Consolas, monospace;
    font-size: 0.9rem;
  }
  p code, li code {
    background: #1a1a1a;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    color: #e06c75;
  }
  pre code {
    background: none;
    padding: 0;
    color: #abb2bf;
  }
  strong { color: #fff; }
  .nav {
    display: flex;
    gap: 1.5rem;
    padding: 1rem 0;
    border-bottom: 1px solid #222;
    margin-bottom: 1rem;
  }
  .nav a {
    color: #888;
    font-size: 0.9rem;
  }
  .nav a:hover { color: #fff; }
  .nav a.active { color: #fff; }
`;

async function renderDocs(): Promise<string> {
  const md = await Deno.readTextFile(new URL("./docs.md", import.meta.url));
  const content = markdownToHtml(md);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>wcp Documentation</title>
  <meta name="description" content="Documentation for wcp - bidirectional log streaming CLI">
  <style>${docsStyle}</style>
</head>
<body>
  <nav class="nav">
    <a href="/">Home</a>
    <a href="/docs" class="active">Docs</a>
    <a href="https://github.com/umbrellamode/wcp">GitHub</a>
  </nav>
  <main>
    ${content}
  </main>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Serve install script
  if (path === "/install" || path === "/install.sh") {
    return new Response(installSh, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Serve wcp.md command file
  if (path === "/wcp.md") {
    return new Response(wcpMd, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Serve docs page
  if (path === "/docs" || path === "/docs/") {
    const docsHtml = await renderDocs();
    return new Response(docsHtml, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Serve landing page
  if (path === "/" || path === "/index.html") {
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // 404 for everything else
  return new Response("Not found", { status: 404 });
});
