import type { MessageRole } from '@ai-chat/shared';

interface ChatMessage {
  role: MessageRole;
  content: string;
}

interface ContextOptions {
  maxMessages?: number;
  maxContextChars?: number;
}

/**
 * Assembles the messages array for the OpenAI-compatible model API.
 * Limits recent messages by count and character budget to stay within context.
 */
export function buildMessagesContext(
  systemPrompt: string,
  recentMessages: Array<{ role: MessageRole; content: string }>,
  userInput: string,
  options: ContextOptions = {},
): ChatMessage[] {
  const maxMessages = options.maxMessages ?? 40;
  const maxContextChars = options.maxContextChars ?? 24_000;
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  const newestMessages = recentMessages.slice(-maxMessages);
  const selectedMessages: ChatMessage[] = [];
  let usedChars = systemPrompt.length + userInput.length;

  for (let index = newestMessages.length - 1; index >= 0; index -= 1) {
    const msg = newestMessages[index];
    const contentLength = msg.content.length;
    if (usedChars + contentLength > maxContextChars) {
      continue;
    }

    selectedMessages.unshift({
      role: msg.role,
      content: msg.content,
    });
    usedChars += contentLength;
  }

  messages.push(...selectedMessages);

  // Append the new user input
  messages.push({
    role: 'user',
    content: userInput,
  });

  return messages;
}
