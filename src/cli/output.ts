/**
 * Premium CLI output utilities
 * Consistent formatting for all wcp output
 */

// Colors
export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

// Icons (consistent across the CLI)
export const icons = {
  success: "✓",
  error: "✗",
  warning: "⚠",
  info: "ℹ",
  arrow: "›",
  bullet: "•",
  diamond: "◆",
  wcp: "◈",
};

export function isTTY(): boolean {
  try {
    return Deno.stdout.isTerminal();
  } catch {
    return false;
  }
}

// Styled text helpers
export function bold(text: string): string {
  return isTTY() ? `${colors.bold}${text}${colors.reset}` : text;
}

export function dim(text: string): string {
  return isTTY() ? `${colors.dim}${text}${colors.reset}` : text;
}

export function green(text: string): string {
  return isTTY() ? `${colors.green}${text}${colors.reset}` : text;
}

export function red(text: string): string {
  return isTTY() ? `${colors.red}${text}${colors.reset}` : text;
}

export function yellow(text: string): string {
  return isTTY() ? `${colors.yellow}${text}${colors.reset}` : text;
}

export function cyan(text: string): string {
  return isTTY() ? `${colors.cyan}${text}${colors.reset}` : text;
}

// Structured output
export function success(message: string): void {
  console.log(`  ${green(icons.success)} ${message}`);
}

export function error(message: string): void {
  console.error(`  ${red(icons.error)} ${message}`);
}

export function warning(message: string): void {
  console.log(`  ${yellow(icons.warning)} ${message}`);
}

export function info(message: string): void {
  console.log(`  ${cyan(icons.info)} ${message}`);
}

export function bullet(message: string): void {
  console.log(`  ${icons.bullet} ${message}`);
}

// Box drawing for important messages
export function box(lines: string[], title?: string): void {
  const maxLen = Math.max(
    ...lines.map((l) => stripAnsi(l).length),
    title?.length ?? 0,
  );
  const width = maxLen + 4;

  console.log("");
  console.log(`  ╭${"─".repeat(width)}╮`);
  if (title) {
    const padding = width - stripAnsi(title).length - 2;
    const left = Math.floor(padding / 2);
    const right = padding - left;
    console.log(`  │${" ".repeat(left)} ${bold(title)} ${" ".repeat(right)}│`);
    console.log(`  ├${"─".repeat(width)}┤`);
  }
  for (const line of lines) {
    const padding = width - stripAnsi(line).length - 2;
    console.log(`  │ ${line}${" ".repeat(padding)} │`);
  }
  console.log(`  ╰${"─".repeat(width)}╯`);
  console.log("");
}

// Strip ANSI codes for length calculation
function stripAnsi(str: string): string {
  // deno-lint-ignore no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

// Next steps helper
export function nextSteps(steps: string[]): void {
  console.log("");
  console.log(`  ${bold("Next steps:")}`);
  for (let i = 0; i < steps.length; i++) {
    console.log(`    ${dim(`${i + 1}.`)} ${steps[i]}`);
  }
  console.log("");
}
