export interface SSEEvents {
  onStart?: (data: { messageId: string }) => void
  onDelta?: (data: { delta: string }) => void
  onDone?: (data: { messageId: string; usage?: { promptTokens: number; completionTokens: number } }) => void
  onError?: (data: { code: string; message: string }) => void
}

export class SSEClient {
  private abortController: AbortController | null = null

  async connect(body: any, apiKey: string, events: SSEEvents): Promise<void> {
    this.abortController = new AbortController()
    const { signal } = this.abortController

    try {
      const response = await fetch('/api/chat/completions/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DeepSeek-Api-Key': apiKey,
        },
        body: JSON.stringify(body),
        signal,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        events.onError?.({ code: 'NETWORK_ERROR', message: error.message || `HTTP ${response.status}` })
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        events.onError?.({ code: 'NETWORK_ERROR', message: 'No response body' })
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          this.parseLine(line, events)
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        this.parseLine(buffer, events)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Intentionally aborted
        return
      }
      events.onError?.({ code: 'NETWORK_ERROR', message: err.message || 'Network error' })
    }
  }

  private parseLine(line: string, events: SSEEvents) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(':')) return

    if (trimmed.startsWith('event: ')) {
      // We handle data lines only, events are embedded in data
      return
    }

    if (trimmed.startsWith('data: ')) {
      const dataStr = trimmed.slice(6).trim()
      if (!dataStr) return

      // Check for event type in the previous 'event:' line
      // We'll detect the event type from the data content
      try {
        const data = JSON.parse(dataStr)

        if (data.delta !== undefined) {
          events.onDelta?.({ delta: data.delta })
        } else if (data.messageId && data.usage !== undefined) {
          events.onDone?.({ messageId: data.messageId, usage: data.usage })
        } else if (data.messageId && data.delta === undefined && data.usage === undefined && !data.code) {
          events.onStart?.({ messageId: data.messageId })
        } else if (data.code || data.error) {
          events.onError?.({ code: data.code || 'UNKNOWN_ERROR', message: data.message || data.error || 'Unknown error' })
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }

  abort() {
    this.abortController?.abort()
    this.abortController = null
  }

  isAborted(): boolean {
    return this.abortController?.signal.aborted ?? false
  }
}

export function createSSEClient(): SSEClient {
  return new SSEClient()
}
