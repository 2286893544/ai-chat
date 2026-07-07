import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeLocalSTTErrorMessage } from '../src/utils/voiceError'

describe('normalizeLocalSTTErrorMessage', () => {
  it('replaces browser abort messages with an actionable transcription message', () => {
    const error = new DOMException('该操作已被中止。', 'AbortError')

    assert.equal(
      normalizeLocalSTTErrorMessage(error, '本地 FunASR'),
      '语音识别被中断，请重新录制或稍后再试',
    )
  })

  it('keeps provider-specific fallback for unknown errors', () => {
    assert.equal(
      normalizeLocalSTTErrorMessage(undefined, '本地 faster-whisper'),
      '本地 faster-whisper 请求失败',
    )
  })
})
