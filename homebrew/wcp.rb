class Wcp < Formula
  desc "Bidirectional log streaming CLI for AI coding agents"
  homepage "https://wcp.dev"
  version "0.2.2"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/umbrellamode/wcp/releases/download/v#{version}/wcp-darwin-arm64"
      sha256 "ef435da58a893cabe739c65ddf4a778f8662e4bfb47913397d993fc9622ef673"
    end
    on_intel do
      url "https://github.com/umbrellamode/wcp/releases/download/v#{version}/wcp-darwin-x64"
      sha256 "4665d7bc3a08b1bfc04a988947793387bf909d3ca897b560d379c3220d4cb27a"
    end
  end

  on_linux do
    on_intel do
      url "https://github.com/umbrellamode/wcp/releases/download/v#{version}/wcp-linux-x64"
      sha256 "b157cf1886d9ed886bf32c8075a0a308f684de86eccde827f40ca9bd997f724f"
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
