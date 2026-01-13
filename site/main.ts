// Initialize Deno KV for install counter (lazy initialization)
let kv: Deno.Kv | null = null;

async function getKv(): Promise<Deno.Kv | null> {
  if (kv) return kv;
  try {
    // On Deno Deploy, openKv() works without arguments
    // Locally, try with a local path if DENO_DEPLOYMENT_ID is not set
    if (Deno.env.get("DENO_DEPLOYMENT_ID")) {
      kv = await Deno.openKv();
    } else {
      // Local development - use local KV path
      const kvPath = Deno.env.get("DENO_KV_PATH") || "./.deno-kv";
      kv = await Deno.openKv(kvPath);
    }
    return kv;
  } catch (error) {
    // Silently fail - install counter is optional
    console.warn("KV not available, install counter disabled:", error);
    return null;
  }
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>wcp - bidirectional log streaming for AI agents</title>
  <meta name="description" content="Run dev servers in the background so your AI can debug errors while you watch the logs live. The shared terminal bridge for Claude, Cursor, and OpenCode.">
  
  <!-- SEO -->
  <meta name="keywords" content="wcp, wormhole, CLI, terminal, log streaming, AI agents, dev server, unix socket, Claude, Cursor, coding assistant">
  <meta name="author" content="umbrellamode">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://wcp.dev">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://wcp.dev">
  <meta property="og:title" content="wcp - bidirectional log streaming for AI agents">
  <meta property="og:description" content="Run dev servers in the background so your AI can debug errors while you watch the logs live. The shared terminal bridge for Claude, Cursor, and OpenCode.">
  <meta property="og:image" content="https://wcp.dev/images/OG.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="wcp">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="wcp - bidirectional log streaming for AI agents">
  <meta name="twitter:description" content="Run dev servers in the background so your AI can debug errors while you watch the logs live. The shared terminal bridge for Claude, Cursor, and OpenCode.">
  <meta name="twitter:image" content="https://wcp.dev/images/OG.png">

  <!-- Favicon -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🕳️</text></svg>">
  
  <!-- Geist Font -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/style.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/style.min.css">
  
  <style>
    :root {
      /* Colors from design system - dark theme */
      --background: #000000;
      --foreground: oklch(0.985 0.001 106.423);
      --card: oklch(0.216 0.006 56.043);
      --card-foreground: oklch(0.985 0.001 106.423);
      --primary: #BAE1FF;
      --primary-foreground: oklch(0.216 0.006 56.043);
      --secondary: oklch(0.268 0.007 34.298);
      --secondary-foreground: oklch(0.985 0.001 106.423);
      --muted: oklch(0.268 0.007 34.298);
      --muted-foreground: oklch(0.709 0.01 56.259);
      --accent: oklch(0.268 0.007 34.298);
      --accent-foreground: oklch(0.985 0.001 106.423);
      --border: oklch(1 0 0 / 10%);
      --input: oklch(1 0 0 / 15%);
      --ring: oklch(0.553 0.013 58.071);
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      border-color: var(--border);
    }
    
    body {
      background: var(--background);
      color: var(--foreground);
      font-family: "Geist Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      padding: 3rem 1.5rem;
      max-width: 720px;
      margin: 0 auto;
    }
    
    code, pre {
      font-family: "Geist Mono", "SF Mono", "Fira Code", Menlo, Consolas, monospace;
    }
    
    /* Header */
    .header {
      margin-bottom: 2.5rem;
    }
    .header-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .header h1 {
      font-size: 2.5rem;
      font-weight: 400;
      letter-spacing: -0.02em;
      margin-bottom: 0;
      color: var(--foreground);
    }
    .title-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .title-left .install-badge {
      margin-top: 0.4rem;
    }
    .header-title .github-btn-wrapper {
      display: flex;
      align-items: center;
      height: 100%;
      margin-top: 0.5rem;
    }
    .install-badge {
      background: var(--secondary);
      color: var(--muted-foreground);
      font-size: 0.75rem;
      font-weight: 400;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
    }
    .install-badge.pulse {
      animation: pulse 0.3s ease-out;
    }
    .tagline {
      color: var(--muted-foreground);
      font-size: 1rem;
      line-height: 1.6;
      max-width: 600px;
      margin-top: 1rem;
    }
    
    /* Logos */
    .logos {
      display: flex;
      gap: 1.5rem;
      margin: 2rem 0;
      align-items: center;
    }
    .logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
    
    /* Installation section */
    .installation {
      margin: 3rem 0;
    }
    .installation h2 {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--foreground);
      margin-bottom: 1.25rem;
      text-transform: none;
      letter-spacing: normal;
    }
    .install-card {
      background: var(--card);
      border-radius: 10px;
      overflow: hidden;
    }
    .install-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
    }
    .install-row code {
      color: var(--muted-foreground);
      font-family: "Geist Mono", "SF Mono", "Fira Code", Menlo, Consolas, monospace;
      font-size: 0.9rem;
    }
    .install-divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 0;
    }
    .copy-btn {
      background: transparent;
      border: none;
      color: var(--muted-foreground);
      cursor: pointer;
      padding: 0.5rem;
      min-width: 44px;
      min-height: 44px;
      transition: color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .copy-btn:hover {
      color: var(--foreground);
    }
    .copy-btn:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
    .copy-btn svg {
      width: 18px;
      height: 18px;
    }
    .install-caption {
      color: var(--muted-foreground);
      font-size: 0.875rem;
      margin-top: 1rem;
    }
    
    /* Terminal styling for Quick Start */
    .terminal-header {
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--border);
    }
    .terminal-label {
      color: var(--muted-foreground);
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .terminal-body {
      padding: 1.25rem 1.5rem;
    }
    .terminal-body pre {
      font-family: "Geist Mono", "SF Mono", "Fira Code", Menlo, Consolas, monospace;
      font-size: 0.85rem;
      line-height: 1.6;
      margin: 0;
    }
    
    /* Sections */
    section {
      margin-bottom: 2.5rem;
    }
    h2 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    p, li {
      color: var(--muted-foreground);
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
      color: var(--primary);
    }
    li code {
      color: var(--primary);
    }
    
    /* Example blocks */
    .example {
      background: var(--card);
      border: 1px solid var(--border);
      padding: 1.25rem;
      margin-top: 1rem;
      overflow-x: auto;
    }
    .example .example-header {
      color: var(--muted-foreground);
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .example pre {
      font-family: inherit;
      font-size: 13px;
      line-height: 1.5;
    }
    .dim { color: var(--muted-foreground); }
    .primary { color: var(--primary); }
    .green { color: #86efac; }
    .yellow { color: #fde047; }
    .cyan { color: var(--primary); }
    .gray { color: var(--muted-foreground); }
    
    /* Footer */
    footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      color: var(--muted-foreground);
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    footer a {
      color: var(--muted-foreground);
      text-decoration: none;
      transition: color 0.2s;
    }
    footer a:hover {
      color: var(--primary);
    }
    footer a:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
    .footer-links {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }
    .github-btn-wrapper {
      display: inline-flex;
      align-items: center;
      height: 28px;
    }
    
    /* Animations */
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(1); }
    }
    
    /* Responsive */
    @media (max-width: 600px) {
      .logo-boxes {
        flex-direction: column;
      }
      .logo-box {
        padding: 1.5rem 1rem;
      }
      .header-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .title-left {
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .header-title .github-btn-wrapper {
        margin-top: 0;
      }
      .install-row code {
        font-size: 0.75rem;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-title">
      <div class="title-left">
        <h1>/wcp</h1>
        <span class="install-badge" id="install-badge">0 installs</span>
      </div>
      <span class="github-btn-wrapper">
        <a class="github-button" href="https://github.com/umbrellamode/wcp" 
           data-color-scheme="no-preference: dark; light: dark; dark: dark;"
           data-icon="octicon-star"
           data-size="large" 
           data-show-count="true" 
           aria-label="Star umbrellamode/wcp on GitHub">Star</a>
      </span>
    </div>
    <p class="tagline">Run dev servers in the background so your AI can debug errors while you watch the logs live. The shared terminal bridge for Claude, Cursor, and OpenCode.</p>
  </div>

  <div class="logos">
    <img class="logo" src="/images/claude.png" alt="Claude Code logo">
    <img class="logo" src="/images/cursor.jpeg" alt="Cursor logo">
    <img class="logo" src="/images/opencode.png" alt="OpenCode logo">
  </div>

  <section class="installation">
    <h2>Installation</h2>
    <div class="install-card">
      <div class="install-row">
        <code><span class="dim">$</span> curl -fsSL https://wcp.dev/install | bash</code>
        <button class="copy-btn" id="copy-btn" title="Copy to clipboard" aria-label="Copy to clipboard">
          <svg class="icon-copy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
          <svg class="icon-check" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:none;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
      </div>
      <hr class="install-divider">
      <div class="install-row">
        <code><span class="dim">></span> /wcp</code>
      </div>
    </div>
    <p class="install-caption">Zero-config setup. Automatically installs the <code>/wcp</code> slash command for Claude, Cursor, and OpenCode.</p>
  </section>

  <section>
    <h2>Quick Start</h2>
    
    <div class="install-card">
      <div class="terminal-header">
        <span class="terminal-label">AI CODING SESSION</span>
      </div>
      <div class="terminal-body">
        <pre><span class="dim">$</span> <span class="primary">wcp dev</span>
<span class="green">✓ wcp opened: dev</span>
<span class="dim">  Socket: ~/.wcp/wcp-dev.sock</span>

<span class="gray">> my-app@1.0.0 dev
> next dev

  ▲ Next.js 16.0.0
  - Local: http://localhost:3000</span></pre>
      </div>
    </div>

    <div class="install-card" style="margin-top: 1rem;">
      <div class="terminal-header">
        <span class="terminal-label">YOUR TERMINAL</span>
      </div>
      <div class="terminal-body">
        <pre><span class="dim">$</span> <span class="primary">wcp</span>
<span class="green">Watching 1 session(s): dev</span>

<span class="yellow">--- Replaying 12 buffered lines ---</span>
<span class="gray">> my-app@1.0.0 dev
> next dev

  ▲ Next.js 16.0.0
  - Local: http://localhost:3000</span>
<span class="yellow">--- Live stream ---</span></pre>
      </div>
    </div>
  </section>

  <section>
    <h2>Workflow & Commands</h2>
    <div class="install-card">
      <div class="terminal-body">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
          <div>
            <div style="color: var(--muted-foreground); font-size: 0.75rem; font-weight: 500; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">For the Agent</div>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 1rem; padding-left: 1.2rem; position: relative; display: flex; flex-direction: column; gap: 0.25rem;">
                <code style="color: var(--primary);">wcp dev</code>
                <span style="color: var(--muted-foreground); font-size: 0.85rem;">Auto-detects and runs your dev script in the background.</span>
              </li>
              <li style="margin-bottom: 1rem; padding-left: 1.2rem; position: relative; display: flex; flex-direction: column; gap: 0.25rem;">
                <code style="color: var(--primary);">wcp &lt;name&gt; -- &lt;cmd&gt;</code>
                <span style="color: var(--muted-foreground); font-size: 0.85rem;">Run any specific command (builds, tests, watchers).</span>
              </li>
            </ul>
          </div>
          <div>
            <div style="color: var(--muted-foreground); font-size: 0.75rem; font-weight: 500; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">For You</div>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 1rem; padding-left: 1.2rem; position: relative; display: flex; flex-direction: column; gap: 0.25rem;">
                <code style="color: var(--primary);">wcp</code>
                <span style="color: var(--muted-foreground); font-size: 0.85rem;">Watch sessions or auto-start dev server if none running.</span>
              </li>
              <li style="margin-bottom: 1rem; padding-left: 1.2rem; position: relative; display: flex; flex-direction: column; gap: 0.25rem;">
                <code style="color: var(--primary);">wcp list</code>
                <span style="color: var(--muted-foreground); font-size: 0.85rem;">See what processes are currently running.</span>
              </li>
              <li style="margin-bottom: 1rem; padding-left: 1.2rem; position: relative; display: flex; flex-direction: column; gap: 0.25rem;">
                <code style="color: var(--primary);">wcp kill &lt;name&gt;</code>
                <span style="color: var(--muted-foreground); font-size: 0.85rem;">Stop a background session.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <span>© 2025 umbrellamode</span>
    <div class="footer-links">
      <a href="/docs">Documentation</a>
      <a href="https://github.com/umbrellamode/wcp">GitHub</a>
    </div>
  </footer>

  <script>
    // Copy button
    const copyBtn = document.getElementById('copy-btn');
    const iconCopy = copyBtn.querySelector('.icon-copy');
    const iconCheck = copyBtn.querySelector('.icon-check');
    
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText('curl -fsSL https://wcp.dev/install | bash');
      iconCopy.style.display = 'none';
      iconCheck.style.display = 'block';
      copyBtn.style.color = '#22c55e';
      
      setTimeout(() => {
        iconCopy.style.display = 'block';
        iconCheck.style.display = 'none';
        copyBtn.style.color = '';
      }, 2000);
    });
    
    // Install count
    async function fetchCount() {
      try {
        const res = await fetch('/api/count');
        const data = await res.json();
        const badge = document.getElementById('install-badge');
        if (badge) {
          const newText = data.count.toLocaleString() + ' installs';
          if (badge.textContent !== newText) {
            badge.textContent = newText;
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 300);
          }
        }
      } catch (e) {}
    }
    fetchCount();
    setInterval(fetchCount, 30000);
  </script>
  <script async defer src="https://buttons.github.io/buttons.js"></script>
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
# Watch sessions (or auto-start dev server if none running)
wcp

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
2. Tell the user: "I've started the dev server. Run \`wcp\` in another terminal to monitor the logs."

## Key points

- Running \`wcp\` with no arguments will watch active sessions, or start the dev server if none are running
- The name can be anything: \`dev\`, \`server\`, \`3000\`, \`my-app\`
- Late-joining terminals see the last 1000 lines of history
- All connected terminals see the same live output
- Socket is at \`~/.wcp/wcp-<name>.sock\`
`;

function generateOgImage(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="100%" style="stop-color:#000000"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Grid pattern -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1a1a" stroke-width="1"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#grid)" opacity="0.5"/>
  
  <!-- Terminal window -->
  <rect x="100" y="120" width="1000" height="400" rx="12" fill="#111" stroke="#333" stroke-width="2"/>
  
  <!-- Terminal header -->
  <rect x="100" y="120" width="1000" height="40" rx="12" fill="#1a1a1a"/>
  <rect x="100" y="148" width="1000" height="12" fill="#1a1a1a"/>
  <circle cx="130" cy="140" r="7" fill="#ff5f56"/>
  <circle cx="155" cy="140" r="7" fill="#ffbd2e"/>
  <circle cx="180" cy="140" r="7" fill="#27ca3f"/>
  
  <!-- Logo -->
  <text x="600" y="260" font-family="SF Mono, Fira Code, monospace" font-size="72" fill="#ffffff" text-anchor="middle" font-weight="400">/wcp</text>
  
  <!-- Tagline -->
  <text x="600" y="320" font-family="SF Mono, Fira Code, monospace" font-size="24" fill="#888888" text-anchor="middle">bidirectional log streaming for AI coding agents</text>
  
  <!-- Command example -->
  <text x="600" y="420" font-family="SF Mono, Fira Code, monospace" font-size="20" fill="#555555" text-anchor="middle">$</text>
  <text x="620" y="420" font-family="SF Mono, Fira Code, monospace" font-size="20" fill="#00ff00" text-anchor="start">curl -fsSL https://wcp.dev/install | bash</text>
  
  <!-- Accent line -->
  <rect x="100" y="600" width="1000" height="4" fill="#00ff00" opacity="0.6"/>
</svg>`;
}

const installSh = `#!/bin/bash

# wcp installer
# https://wcp.dev

set -e

REPO="umbrellamode/wcp"
WCP_URL="https://wcp.dev/wcp.md"

echo ""
echo " _  _  _ ___ ___"
echo "| || || | __| _ \\\\"
echo "| | V V | _||  _/"
echo " \\\\_/\\\\_/ |___|_|"
echo ""

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  darwin)
    case "$ARCH" in
      arm64|aarch64) BINARY="wcp-darwin-arm64" ;;
      x86_64) BINARY="wcp-darwin-x64" ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  linux)
    case "$ARCH" in
      x86_64) BINARY="wcp-linux-x64" ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

# Get latest release URL
DOWNLOAD_URL="https://github.com/$REPO/releases/latest/download/$BINARY"

# Determine install location
if [ -w "/usr/local/bin" ]; then
  INSTALL_DIR="/usr/local/bin"
else
  INSTALL_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR"
fi

echo "Installing wcp..."
echo "  Downloading $BINARY..."

# Download binary
curl -fsSL "$DOWNLOAD_URL" -o "$INSTALL_DIR/wcp"
chmod +x "$INSTALL_DIR/wcp"

echo "✓ Installed wcp to $INSTALL_DIR/wcp"

# Check if install dir is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo ""
  echo "  ⚠ $INSTALL_DIR is not in your PATH"
  echo "  Add this to your shell profile:"
  echo "    export PATH=\\"$INSTALL_DIR:\\$PATH\\""
fi

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

# Track install (silent, non-blocking)
curl -sfSL -X POST "https://wcp.dev/api/install" > /dev/null 2>&1 &

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
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://wcp.dev/docs">
  <meta property="og:title" content="wcp Documentation">
  <meta property="og:description" content="Documentation for wcp - bidirectional log streaming CLI">
  <meta property="og:image" content="https://wcp.dev/images/OG.png">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="wcp Documentation">
  <meta name="twitter:description" content="Documentation for wcp - bidirectional log streaming CLI">
  <meta name="twitter:image" content="https://wcp.dev/images/OG.png">
  
  <!-- Favicon -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🕳️</text></svg>">
  
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

  // API: Increment install counter
  if (path === "/api/install" && req.method === "POST") {
    const db = await getKv();
    if (!db) {
      return new Response(JSON.stringify({ count: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const key = ["installs", "count"];
    const result = await db.get<number>(key);
    const newCount = (result.value || 0) + 1;
    await db.set(key, newCount);
    return new Response(JSON.stringify({ count: newCount }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // API: Get install count
  if (path === "/api/count") {
    const db = await getKv();
    if (!db) {
      return new Response(JSON.stringify({ count: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const result = await db.get<number>(["installs", "count"]);
    return new Response(JSON.stringify({ count: result.value || 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Serve OG image
  if (path === "/og.png" || path === "/og.svg") {
    const svg = generateOgImage();
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // Serve images from /images/
  if (path.startsWith("/images/")) {
    const filename = path.slice(8); // Remove "/images/"
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType = ext === "png"
      ? "image/png"
      : ext === "jpeg" || ext === "jpg"
      ? "image/jpeg"
      : "application/octet-stream";
    try {
      const imageData = await Deno.readFile(
        new URL(`./images/${filename}`, import.meta.url),
      );
      return new Response(imageData, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

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
