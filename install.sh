#!/bin/bash

# wcp installer
# https://wcp.dev

set -e

REPO="umbrellamode/wcp"
WCP_URL="https://wcp.dev/wcp.md"

echo ""
echo " _  _  _ ___ ___"
echo "| || || | __| _ \\"
echo "| | V V | _||  _/"
echo " \\_/\\_/ |___|_|"
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
  echo "    export PATH=\"$INSTALL_DIR:\$PATH\""
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

echo ""
echo "Done! Run 'wcp dev' to get started."
