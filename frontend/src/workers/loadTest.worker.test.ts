import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LoadTest Worker', () => {
  let worker: Worker;

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should execute concurrent simulations and return correct results', async () => {
    // Setup mock responses
    mockFetch
      .mockResolvedValueOnce({ ok: true } as Response) // Success
      .mockResolvedValueOnce({ ok: false } as Response) // Error
      .mockRejectedValueOnce(new Error('Network error')); // Error

    // Mock the postMessage function that the worker will call
    const postMessageMock = vi.fn();
    (global as any).postMessage = postMessageMock;

    // We need to isolate the worker logic.
    // Since worker logic runs in the global scope (self), we'll mock 'self' context.

    // Dynamically import the worker to execute its global code
    // In Vitest, we can just load the file since it relies on `self`.

    // Setting up self before importing
    const selfMock = {
      onmessage: null as any,
      postMessage: postMessageMock,
    };
    Object.defineProperty(global, 'self', { value: selfMock, writable: true });

    await import('./loadTest.worker.ts');

    expect(selfMock.onmessage).not.toBeNull();

    const mockEvent = {
      data: {
        concurrentUsers: 3,
        iterations: 1,
        url: 'http://test-url.com',
        apiKey: 'test-key'
      }
    };

    // Trigger the worker
    await selfMock.onmessage(mockEvent as unknown as MessageEvent);

    // Assert that fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenCalledWith('http://test-url.com', {
      headers: {
        'x-api-key': 'test-key'
      }
    });

    // Assert the correct result is posted back
    expect(postMessageMock).toHaveBeenCalledTimes(1);
    const result = postMessageMock.mock.calls[0][0];

    expect(result).toHaveProperty('success', 1);
    expect(result).toHaveProperty('errors', 2);
    expect(result).toHaveProperty('totalDuration');
    expect(typeof result.totalDuration).toBe('number');
  });
});
