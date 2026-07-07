import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMessagesContext } from './context.js';

describe('buildMessagesContext', () => {
  it('keeps the system prompt and newest messages within the max message count', () => {
    const messages = Array.from({ length: 6 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `message-${index}`,
    }));

    const result = buildMessagesContext('system', messages, 'latest input', {
      maxMessages: 3,
      maxContextChars: 10_000,
    });

    assert.deepEqual(result.map((message) => message.content), [
      'system',
      'message-3',
      'message-4',
      'message-5',
      'latest input',
    ]);
  });

  it('trims older history by character budget while preserving the latest input', () => {
    const result = buildMessagesContext(
      'system prompt',
      [
        { role: 'user', content: 'older message that should be removed' },
        { role: 'assistant', content: 'recent short reply' },
      ],
      'new user input',
      {
        maxMessages: 40,
        maxContextChars: 'system prompt'.length + 'recent short reply'.length + 'new user input'.length + 2,
      },
    );

    assert.deepEqual(result.map((message) => message.content), [
      'system prompt',
      'recent short reply',
      'new user input',
    ]);
  });
});
