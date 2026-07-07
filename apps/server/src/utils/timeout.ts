export function createTimeoutSignal(timeoutMs: number, upstream?: AbortSignal): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const abortFromUpstream = () => controller.abort();
  if (upstream) {
    if (upstream.aborted) {
      controller.abort();
    } else {
      upstream.addEventListener('abort', abortFromUpstream, { once: true });
    }
  }

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer);
      upstream?.removeEventListener('abort', abortFromUpstream);
    },
  };
}

export async function fetchWithTimeout(input: string | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
  const timeout = createTimeoutSignal(timeoutMs, init.signal || undefined);
  try {
    return await fetch(input, { ...init, signal: timeout.signal });
  } finally {
    timeout.clear();
  }
}
