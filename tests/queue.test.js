import { createRequire } from 'node:module';
import { describe, it, expect, beforeEach } from '@jest/globals';

const require = createRequire(import.meta.url);
const { Queue } = require('../build/Release/queue_native.node');

describe('Native Circular Queue (QueueWrapper)', () => {
  let queue;

  beforeEach(() => {
    queue = new Queue(3);
  });

  it('should initialize empty with size 0', () => {
    // 1. Verify initial size and isEmpty status
    expect(queue.size()).toBe(0);
    expect(queue.isEmpty()).toBe(true);
    expect(queue.peek()).toBeNull();
  });

  it('should push items and maintain size', () => {
    // Core logic: Push items and test return values + size updates
    const pushResult = queue.push('job-1');

    expect(pushResult).toBe(true);
    expect(queue.size()).toBe(1);
    expect(queue.isEmpty()).toBe(false);
    expect(queue.peek()).toBe('job-1');
  });

  it('should enforce capacity limits and reject overflow', () => {
    // Core logic: Fill to capacity (3) and attempt a 4th push
    queue.push('job-1');
    queue.push('job-2');
    queue.push('job-3');

    const overflowResult = queue.push('job-4');

    expect(overflowResult).toBe(false);
    expect(queue.size()).toBe(3);
  });

  it('should follow strict FIFO order on pop', () => {
    // Core logic: Push multiple items, pop them in sequence
    queue.push('first');
    queue.push('second');

    expect(queue.pop()).toBe('first');
    expect(queue.pop()).toBe('second');
    expect(queue.pop()).toBeNull();
    expect(queue.isEmpty()).toBe(true);
  });

  it('should correctly wrap around circular buffer pointers', () => {
    // Core logic: Push 3 -> Pop 2 -> Push 2 to test modulo wrap-around
    queue.push('a');
    queue.push('b');
    queue.push('c'); // Buffer is full: [a, b, c], head=0, tail=0

    expect(queue.pop()).toBe('a'); // head=1
    expect(queue.pop()).toBe('b'); // head=2

    // Push new items into the freed space
    expect(queue.push('d')).toBe(true); // tail moves to index 0
    expect(queue.push('e')).toBe(true); // tail moves to index 1

    expect(queue.size()).toBe(3);
    expect(queue.pop()).toBe('c');
    expect(queue.pop()).toBe('d');
    expect(queue.pop()).toBe('e');
  });

  it('should throw TypeError when non-string payload is passed', () => {
    // Core logic: Verify C++ type guard catches invalid arguments
    expect(() => queue.push(123)).toThrow();
    expect(() => queue.push({})).toThrow();
  });
});