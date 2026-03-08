import type { Message } from '../api/client';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'USER';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-100'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] opacity-50">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.tokenCount && (
            <span className="text-[10px] opacity-40">{message.tokenCount} tokens</span>
          )}
        </div>
      </div>
    </div>
  );
}
