import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type { Message, ChatResponse } from '../api/client';

export function useChat(agentId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUsage, setLastUsage] = useState<ChatResponse['usage'] | null>(null);

  const loadConversations = useCallback(async () => {
    if (!agentId) return;
    try {
      const conversations = await api.chat.conversations(agentId);
      if (conversations.length > 0) {
        setMessages(conversations[0]!.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [agentId]);

  const sendMessage = async (text: string) => {
    if (!agentId || loading) return;
    setLoading(true);

    // Optimistic: add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: '',
      role: 'USER',
      content: text,
      tokenCount: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await api.chat.send(agentId, text);
      setLastUsage(result.usage);
      // Replace temp message with real messages
      await loadConversations();
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          conversationId: '',
          role: 'ASSISTANT',
          content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          tokenCount: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, lastUsage, sendMessage, loadConversations };
}
