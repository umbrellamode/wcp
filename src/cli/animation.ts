/**
 * 3D ASCII animations for wcp
 */

const FRAME_DELAY = 50; // ms between frames

/**
 * Check if we're running in a TTY
 */
function isTTY(): boolean {
  try {
    return Deno.stdout.isTerminal();
  } catch {
    return false;
  }
}

/**
 * Get console dimensions with fallbacks
 */
function getConsoleSize(): { columns: number; rows: number } {
  try {
    return Deno.consoleSize();
  } catch {
    return { columns: 80, rows: 24 };
  }
}

/**
 * Clear screen and move cursor to top
 */
function clearScreen(): void {
  if (!isTTY()) return;
  Deno.stdout.writeSync(new TextEncoder().encode("\x1b[2J\x1b[H"));
}

/**
 * Hide cursor during animation
 */
function hideCursor(): void {
  if (!isTTY()) return;
  Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25l"));
}

/**
 * Show cursor after animation
 */
function showCursor(): void {
  if (!isTTY()) return;
  Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));
}

/**
 * Sleep for given milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a wormhole tunnel frame
 */
function generateWormholeFrame(
  frame: number,
  width: number,
  height: number,
): string[] {
  const lines: string[] = [];
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  // Characters for depth effect (far to near)
  const depthChars = " .·:;+*#@█";

  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = (y - centerY) * 2; // Aspect ratio correction
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Create spiral effect
      const angle = Math.atan2(dy, dx);
      const spiral = (distance * 0.3 + angle * 2 + frame * 0.3) % (Math.PI * 2);

      // Depth based on distance from center and time
      const depth = Math.sin(spiral) * 0.5 + 0.5;
      const pulseDepth = Math.sin(frame * 0.2 - distance * 0.1) * 0.3 + 0.7;

      // Ring effect - create concentric circles that pulse
      const ringPhase = (distance * 0.5 - frame * 0.8) % 6;
      const inRing = ringPhase > 0 && ringPhase < 2;

      // Calculate final intensity
      let intensity: number;
      if (distance < 3) {
        // Center of wormhole - bright core
        intensity = 0.9 + Math.sin(frame * 0.5) * 0.1;
      } else if (inRing) {
        intensity = depth * pulseDepth * 0.9;
      } else {
        intensity = depth * pulseDepth * 0.4;
      }

      // Fade out at edges
      const maxDist = Math.min(centerX, centerY * 2);
      if (distance > maxDist * 0.7) {
        intensity *= 1 - (distance - maxDist * 0.7) / (maxDist * 0.3);
      }

      const charIndex = Math.floor(
        Math.max(0, Math.min(1, intensity)) * (depthChars.length - 1),
      );
      line += depthChars[charIndex];
    }
    lines.push(line);
  }

  return lines;
}

/**
 * Add text overlay to frame
 */
function addTextOverlay(lines: string[], text: string, y: number): void {
  if (y >= 0 && y < lines.length) {
    const x = Math.floor((lines[0].length - text.length) / 2);
    if (x >= 0) {
      lines[y] = lines[y].substring(0, x) + text +
        lines[y].substring(x + text.length);
    }
  }
}

/**
 * Play the wormhole animation
 */
export async function playWormholeAnimation(
  duration: number = 2000,
): Promise<void> {
  // Skip animation if not in TTY
  if (!isTTY()) {
    console.log("Initializing...");
    return;
  }

  const size = getConsoleSize();
  const width = Math.min(size.columns, 80);
  const height = Math.min(size.rows - 2, 24);

  const frames = Math.floor(duration / FRAME_DELAY);

  hideCursor();

  try {
    for (let frame = 0; frame < frames; frame++) {
      const lines = generateWormholeFrame(frame, width, height);

      // Add "INITIALIZING" text that phases in
      const progress = frame / frames;
      if (progress > 0.2 && progress < 0.8) {
        const textAlpha = Math.sin((progress - 0.2) / 0.6 * Math.PI);
        if (textAlpha > 0.3) {
          const centerY = Math.floor(height / 2);
          addTextOverlay(lines, "◈ INITIALIZING ◈", centerY);
        }
      }

      clearScreen();
      console.log(lines.join("\n"));

      await sleep(FRAME_DELAY);
    }
  } finally {
    showCursor();
    clearScreen();
  }
}

/**
 * Scanning animation with rotating 3D cube wireframe
 */
export async function playScanAnimation(
  onFrame: (frame: number) => string | null,
): Promise<void> {
  const width = 40;
  const height = 12;

  hideCursor();

  try {
    let frame = 0;
    let statusText: string | null = null;

    while (true) {
      statusText = onFrame(frame);
      if (statusText === null) break;

      const cubeLines = generate3DCube(frame, width, height);

      // Clear and redraw
      clearScreen();

      // Draw cube
      for (const line of cubeLines) {
        console.log(line);
      }

      // Status text below
      console.log("");
      console.log(`  ${statusText}`);

      frame++;
      await sleep(FRAME_DELAY);
    }
  } finally {
    showCursor();
  }
}

/**
 * Generate a rotating 3D cube wireframe
 */
function generate3DCube(
  frame: number,
  width: number,
  height: number,
): string[] {
  const canvas: string[][] = [];
  for (let y = 0; y < height; y++) {
    canvas.push(new Array(width).fill(" "));
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const size = Math.min(width, height * 2) * 0.3;

  // Rotation angles
  const angleX = frame * 0.05;
  const angleY = frame * 0.07;
  const angleZ = frame * 0.03;

  // Cube vertices
  const vertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];

  // Cube edges
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0], // back face
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4], // front face
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7], // connecting edges
  ];

  // Project vertices
  const projected = vertices.map(([x, y, z]) => {
    // Rotate around X
    const y1 = y * Math.cos(angleX) - z * Math.sin(angleX);
    const z1 = y * Math.sin(angleX) + z * Math.cos(angleX);

    // Rotate around Y
    const x2 = x * Math.cos(angleY) + z1 * Math.sin(angleY);
    const z2 = -x * Math.sin(angleY) + z1 * Math.cos(angleY);

    // Rotate around Z
    const x3 = x2 * Math.cos(angleZ) - y1 * Math.sin(angleZ);
    const y3 = x2 * Math.sin(angleZ) + y1 * Math.cos(angleZ);

    // Project to 2D
    const scale = 2 / (3 + z2);
    return [
      Math.floor(centerX + x3 * size * scale),
      Math.floor(centerY + y3 * size * scale * 0.5),
    ];
  });

  // Draw edges
  const edgeChars = "─│╱╲┼";
  for (const [i, j] of edges) {
    const [x1, y1] = projected[i];
    const [x2, y2] = projected[j];
    drawLine(canvas, x1, y1, x2, y2, edgeChars);
  }

  // Draw vertices
  for (const [x, y] of projected) {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      canvas[y][x] = "◆";
    }
  }

  return canvas.map((row) => row.join(""));
}

/**
 * Draw a line on the canvas using Bresenham's algorithm
 */
function drawLine(
  canvas: string[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  _chars: string,
): void {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  let x = x1;
  let y = y1;

  const height = canvas.length;
  const width = canvas[0]?.length ?? 0;

  while (true) {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      // Choose character based on line direction
      if (dx > dy * 2) {
        canvas[y][x] = "─";
      } else if (dy > dx * 2) {
        canvas[y][x] = "│";
      } else if ((sx > 0) === (sy > 0)) {
        canvas[y][x] = "╲";
      } else {
        canvas[y][x] = "╱";
      }
    }

    if (x === x2 && y === y2) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/**
 * Simple progress bar with spinner
 */
export function spinner(frame: number): string {
  const spinChars = "◐◓◑◒";
  return spinChars[frame % spinChars.length];
}

/**
 * Animated "success" celebration
 */
export async function playSuccessAnimation(): Promise<void> {
  const frames = [
    "    ✓    ",
    "   ✓ ✓   ",
    "  ✓   ✓  ",
    " ✓     ✓ ",
    "✓       ✓",
    " ✓     ✓ ",
    "  ✓   ✓  ",
    "   ✓ ✓   ",
    "    ✓    ",
    "   ◆✓◆   ",
    "  ◆ ✓ ◆  ",
    " ◆  ✓  ◆ ",
    "◆   ✓   ◆",
  ];

  hideCursor();
  try {
    for (const frame of frames) {
      Deno.stdout.writeSync(new TextEncoder().encode(`\r${frame}`));
      await sleep(60);
    }
    console.log("");
  } finally {
    showCursor();
  }
}
