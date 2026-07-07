import type { MessageRole } from '@ai-chat/shared';

interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * Assembles the messages array for the DeepSeek API.
 * Limits to 40 recent messages to stay within context window.
 */
export function buildMessagesContext(
  systemPrompt: string,
  recentMessages: Array<{ role: MessageRole; content: string }>,
  userInput: string,
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Take the most recent 40 messages to stay within context limits
  const truncatedMessages = recentMessages.slice(-40);

  for (const msg of truncatedMessages) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Append the new user input
  messages.push({
    role: 'user',
    content: userInput,
  });

  return messages;
}
