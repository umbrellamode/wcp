#!/bin/bash
set -e

# Update Homebrew tap with latest release
# Usage: ./scripts/update-homebrew.sh

REPO="umbrellamode/wcp"
TAP_REPO="umbrellamode/homebrew-tap"
FORMULA_NAME="wcp"

echo "Fetching latest release..."
RELEASE_JSON=$(gh release view --repo "$REPO" --json tagName,assets)
VERSION=$(echo "$RELEASE_JSON" | jq -r '.tagName' | sed 's/^v//')

echo "Version: $VERSION"

# Extract SHA256 for each platform
SHA_DARWIN_ARM64=$(echo "$RELEASE_JSON" | jq -r '.assets[] | select(.name == "wcp-darwin-arm64") | .digest' | sed 's/sha256://')
SHA_DARWIN_X64=$(echo "$RELEASE_JSON" | jq -r '.assets[] | select(.name == "wcp-darwin-x64") | .digest' | sed 's/sha256://')
SHA_LINUX_X64=$(echo "$RELEASE_JSON" | jq -r '.assets[] | select(.name == "wcp-linux-x64") | .digest' | sed 's/sha256://')

echo "SHA256 darwin-arm64: $SHA_DARWIN_ARM64"
echo "SHA256 darwin-x64: $SHA_DARWIN_X64"
echo "SHA256 linux-x64: $SHA_LINUX_X64"

# Check if tap repo exists, create if not
if ! gh repo view "$TAP_REPO" > /dev/null 2>&1; then
  echo "Creating tap repository..."
  gh repo create "$TAP_REPO" --public --description "Homebrew tap for umbrellamode projects"
fi

# Clone or update tap repo
TAP_DIR=$(mktemp -d)
echo "Cloning tap to $TAP_DIR..."
gh repo clone "$TAP_REPO" "$TAP_DIR"

# Create Formula directory
mkdir -p "$TAP_DIR/Formula"

# Generate formula
cat > "$TAP_DIR/Formula/$FORMULA_NAME.rb" << EOF
class Wcp < Formula
  desc "Bidirectional log streaming CLI for AI coding agents"
  homepage "https://wcp.dev"
  version "$VERSION"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/$REPO/releases/download/v#{version}/wcp-darwin-arm64"
      sha256 "$SHA_DARWIN_ARM64"
    end
    on_intel do
      url "https://github.com/$REPO/releases/download/v#{version}/wcp-darwin-x64"
      sha256 "$SHA_DARWIN_X64"
    end
  end

  on_linux do
    on_intel do
      url "https://github.com/$REPO/releases/download/v#{version}/wcp-linux-x64"
      sha256 "$SHA_LINUX_X64"
    end
  end

  def install
    binary_name = stable.url.split("/").last
    bin.install binary_name => "wcp"
  end

  test do
    assert_match "wcp", shell_output("#{bin}/wcp --version")
  end
end
EOF

# Commit and push
cd "$TAP_DIR"
git add Formula/$FORMULA_NAME.rb
if git diff --staged --quiet; then
  echo "No changes to commit"
else
  git commit -m "Update $FORMULA_NAME to $VERSION"
  git push
  echo "Pushed update to $TAP_REPO"
fi

# Cleanup
rm -rf "$TAP_DIR"

echo ""
echo "Done! Users can install with:"
echo "  brew install umbrellamode/tap/wcp"
