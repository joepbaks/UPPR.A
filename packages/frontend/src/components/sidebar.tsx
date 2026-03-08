import { useState } from 'react';
import type { Agent } from '../api/client';

interface SidebarProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, role: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function Sidebar({ agents, selectedId, onSelect, onCreate, onDelete }: SidebarProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !role.trim()) return;
    await onCreate(name, role);
    setName('');
    setRole('');
    setShowCreate(false);
  };

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">UPPR.A</h1>
        <p className="text-xs text-gray-500">Agent Platform</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer mb-1 ${
              selectedId === agent.id
                ? 'bg-blue-600/20 border border-blue-600/40'
                : 'hover:bg-gray-800'
            }`}
            onClick={() => onSelect(agent.id)}
          >
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{agent.name}</div>
              <div className="text-xs text-gray-500 truncate">{agent.role}</div>
            </div>
            <button
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs px-2"
              onClick={(e) => { e.stopPropagation(); onDelete(agent.id); }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-800">
        {showCreate ? (
          <div className="space-y-2">
            <input
              className="w-full bg-gray-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Agent name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full bg-gray-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Role (e.g. Research Assistant)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-500 rounded py-1.5 text-sm font-medium"
                onClick={handleCreate}
              >
                Create
              </button>
              <button
                className="px-3 bg-gray-700 hover:bg-gray-600 rounded py-1.5 text-sm"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-sm font-medium"
            onClick={() => setShowCreate(true)}
          >
            + New Agent
          </button>
        )}
      </div>
    </div>
  );
}
