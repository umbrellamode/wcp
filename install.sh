#!/bin/bash

# wcp installer
# https://wcp.dev

set -e

WCP_URL="https://wcp.dev/wcp.md"
SOURCE_URL="https://raw.githubusercontent.com/umbrellamode/wcp/main/mod.ts"

echo ""
echo " _  _  _ ___ ___"
echo "| || || | __| _ \\"
echo "| | V V | _||  _/"
echo " \\_/\\_/ |___|_|"
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
