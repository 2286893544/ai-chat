import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSttForwardForm, parseSttRequest } from './stt.js';

const wavDataUrl = `data:audio/wav;base64,${Buffer.from('audio').toString('base64')}`;

describe('stt route helpers', () => {
  it('accepts funasr as a local STT provider', () => {
    const request = parseSttRequest({
      provider: 'funasr',
      audioDataUrl: wavDataUrl,
      language: 'zh',
    });

    assert.equal(request.provider, 'funasr');
  });

  it('forwards the selected provider to the local STT service', async () => {
    const form = buildSttForwardForm({
      provider: 'funasr',
      audioDataUrl: wavDataUrl,
      model: 'paraformer',
      language: 'zh',
    });

    assert.equal(form.get('provider'), 'funasr');
    assert.equal(form.get('model'), 'paraformer');
    assert.equal(form.get('language'), 'zh');
  });
});
