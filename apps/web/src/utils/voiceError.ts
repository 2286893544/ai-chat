function isAbortLikeError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const maybeError = error as { name?: string; message?: string }
  const message = maybeError.message || ''

  return (
    maybeError.name === 'AbortError' ||
    /aborted|abort/i.test(message) ||
    message.includes('中止')
  )
}

export function normalizeLocalSTTErrorMessage(error: unknown, providerLabel: string): string {
  if (isAbortLikeError(error)) {
    return '语音识别被中断，请重新录制或稍后再试'
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return `${providerLabel} 请求失败`
}
