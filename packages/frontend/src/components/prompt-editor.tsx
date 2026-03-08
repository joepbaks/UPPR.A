import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { AgentPrompt } from '../api/client';

interface PromptEditorProps {
  agentId: string;
}

export function PromptEditor({ agentId }: PromptEditorProps) {
  const [prompts, setPrompts] = useState<AgentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [reason, setReason] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const loadPrompts = () => {
    setLoading(true);
    api.prompts.list(agentId).then(setPrompts).finally(() => setLoading(false));
  };

  useEffect(() => { loadPrompts(); }, [agentId]);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    await api.prompts.create(agentId, newContent, reason || undefined);
    setNewContent('');
    setReason('');
    setShowCreate(false);
    loadPrompts();
  };

  const handleActivate = async (promptId: string) => {
    await api.prompts.activate(agentId, promptId);
    loadPrompts();
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">System Prompts</h3>
        <button
          className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'Cancel' : '+ New Version'}
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 p-4 rounded-lg bg-gray-900 border border-gray-700 space-y-2">
          <textarea
            className="w-full bg-gray-800 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
            placeholder="System prompt content..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <input
            className="w-full bg-gray-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Reason for change (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-500 rounded px-4 py-1.5 text-sm font-medium"
            onClick={handleCreate}
          >
            Save Prompt
          </button>
        </div>
      )}

      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className={`mb-3 p-4 rounded-lg border ${
            prompt.isActive
              ? 'bg-blue-600/10 border-blue-600/30'
              : 'bg-gray-900/50 border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded">v{prompt.version}</span>
              {prompt.isActive && (
                <span className="text-[10px] bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded">Active</span>
              )}
            </div>
            {!prompt.isActive && (
              <button
                className="text-xs text-blue-400 hover:text-blue-300"
                onClick={() => handleActivate(prompt.id)}
              >
                Activate
              </button>
            )}
          </div>
          <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">{prompt.content}</pre>
          <div className="mt-2 text-[10px] text-gray-600">
            {prompt.reason && <span>{prompt.reason} &middot; </span>}
            {new Date(prompt.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
