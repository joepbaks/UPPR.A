import { useState, useEffect, useRef } from 'react';
import type { Agent } from '../api/client';
import { useChat } from '../hooks/use-chat';
import { MessageBubble } from './message-bubble';
import { ActivityLog } from './activity-log';
import { PromptEditor } from './prompt-editor';

interface ChatViewProps {
  agent: Agent;
}

type Tab = 'chat' | 'activity' | 'prompts';

export function ChatView({ agent }: ChatViewProps) {
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<Tab>('chat');
  const { messages, loading, lastUsage, sendMessage, loadConversations } = useChat(agent.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{agent.name}</h2>
          <p className="text-xs text-gray-500">{agent.role} &middot; {agent.type}</p>
        </div>
        <div className="flex gap-1">
          {(['chat', 'activity', 'prompts'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`px-3 py-1 rounded text-xs font-medium ${
                tab === t ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'chat' && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-600 mt-20">
                <div className="text-4xl mb-3">&#128172;</div>
                <p>Start a conversation with {agent.name}</p>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-800 rounded-2xl px-4 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Token usage bar */}
          {lastUsage && (
            <div className="px-6 py-1 text-[10px] text-gray-600 flex gap-3">
              <span>Prompt: {lastUsage.promptTokens}</span>
              <span>Completion: {lastUsage.completionTokens}</span>
              <span>Total: {lastUsage.totalTokens}</span>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex gap-2">
              <textarea
                className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px] max-h-[120px]"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-5 py-3 text-sm font-medium"
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}

      {tab === 'activity' && <ActivityLog agentId={agent.id} />}
      {tab === 'prompts' && <PromptEditor agentId={agent.id} />}
    </div>
  );
}
