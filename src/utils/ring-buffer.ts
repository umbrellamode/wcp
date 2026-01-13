/**
 * RingBuffer<T> - Fixed-size circular buffer for storing recent log lines
 *
 * Key characteristics:
 * - O(1) push operation (no array resizing)
 * - O(n) toArray retrieval (maintains insertion order)
 * - Memory-bounded (configurable capacity, default 1000)
 */
export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0; // Next write position
  private count: number = 0; // Current number of items
  private readonly capacity: number;

  constructor(capacity: number = 1000) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /** Add an item to the buffer, overwriting oldest if full */
  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /** Get all items in insertion order (oldest first) */
  toArray(): T[] {
    if (this.count === 0) return [];

    const result: T[] = [];
    // Start from the oldest item
    const start = this.count < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      const index = (start + i) % this.capacity;
      result.push(this.buffer[index] as T);
    }
    return result;
  }

  /** Current number of items in buffer */
  size(): number {
    return this.count;
  }

  /** Clear all items */
  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.count = 0;
  }
}
