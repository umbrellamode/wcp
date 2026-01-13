export interface MenuOption<T> {
  label: string;
  description?: string;
  value: T;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function write(text: string): void {
  Deno.stdout.writeSync(encoder.encode(text));
}

function hideCursor(): void {
  write("\x1b[?25l");
}

function showCursor(): void {
  write("\x1b[?25h");
}

function moveUp(n: number): void {
  if (n > 0) write(`\x1b[${n}A`);
}

function clearLine(): void {
  write("\x1b[2K\r");
}

function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`;
}

function dim(text: string): string {
  return `\x1b[2m${text}\x1b[0m`;
}

function green(text: string): string {
  return `\x1b[32m${text}\x1b[0m`;
}

function renderMenu<T>(
  options: MenuOption<T>[],
  selectedIndex: number,
  prompt: string,
): number {
  let lines = 0;

  write(prompt + "\n");
  lines++;

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const prefix = i === selectedIndex ? green("  › ") : "    ";
    const label = i === selectedIndex ? bold(opt.label) : opt.label;
    const desc = opt.description ? dim(`  ${opt.description}`) : "";
    write(`${prefix}${label}${desc}\n`);
    lines++;
  }

  write("\n" + dim("[↑↓ to move, Enter to select, q to quit]") + "\n");
  lines += 2;

  return lines;
}

function clearMenu(lines: number): void {
  moveUp(lines);
  for (let i = 0; i < lines; i++) {
    clearLine();
    write("\n");
  }
  moveUp(lines);
}

export async function selectOption<T>(
  options: MenuOption<T>[],
  prompt: string,
): Promise<T | null> {
  if (options.length === 0) return null;

  let selectedIndex = 0;
  let renderedLines = 0;

  // Set stdin to raw mode
  Deno.stdin.setRaw(true);
  hideCursor();

  try {
    // Initial render
    renderedLines = renderMenu(options, selectedIndex, prompt);

    const buf = new Uint8Array(3);

    while (true) {
      const n = await Deno.stdin.read(buf);
      if (n === null) break;

      const input = buf.slice(0, n);

      // Check for escape sequences (arrow keys)
      if (input[0] === 27 && input[1] === 91) {
        // Arrow keys
        if (input[2] === 65) {
          // Up arrow
          selectedIndex = selectedIndex > 0
            ? selectedIndex - 1
            : options.length - 1;
        } else if (input[2] === 66) {
          // Down arrow
          selectedIndex = selectedIndex < options.length - 1
            ? selectedIndex + 1
            : 0;
        }
      } else if (input[0] === 13 || input[0] === 10) {
        // Enter
        clearMenu(renderedLines);
        return options[selectedIndex].value;
      } else if (input[0] === 113 || input[0] === 3) {
        // q or Ctrl+C
        clearMenu(renderedLines);
        return null;
      } else if (input[0] === 107 || input[0] === 16) {
        // k or Ctrl+P (vim up)
        selectedIndex = selectedIndex > 0
          ? selectedIndex - 1
          : options.length - 1;
      } else if (input[0] === 106 || input[0] === 14) {
        // j or Ctrl+N (vim down)
        selectedIndex = selectedIndex < options.length - 1
          ? selectedIndex + 1
          : 0;
      }

      // Re-render
      clearMenu(renderedLines);
      renderedLines = renderMenu(options, selectedIndex, prompt);
    }
  } finally {
    showCursor();
    Deno.stdin.setRaw(false);
  }

  return null;
}
