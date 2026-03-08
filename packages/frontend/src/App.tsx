import { useState } from 'react';
import { useAgents } from './hooks/use-agents';
import { Sidebar } from './components/sidebar';
import { ChatView } from './components/chat-view';

export function App() {
  const { agents, loading, createAgent, deleteAgent } = useAgents();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.id === selectedId) ?? null;

  // Auto-select first agent
  if (!selectedId && agents.length > 0) {
    setSelectedId(agents[0]!.id);
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <Sidebar
        agents={agents}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={async (name, role) => {
          const agent = await createAgent(name, role);
          setSelectedId(agent.id);
        }}
        onDelete={async (id) => {
          await deleteAgent(id);
          if (selectedId === id) setSelectedId(null);
        }}
      />

      <div className="flex-1">
        {loading && !selectedAgent && (
          <div className="flex items-center justify-center h-full text-gray-600">Loading...</div>
        )}
        {!loading && !selectedAgent && (
          <div className="flex items-center justify-center h-full text-gray-600">
            <div className="text-center">
              <div className="text-5xl mb-4">&#129302;</div>
              <p className="text-lg">Select or create an agent to get started</p>
            </div>
          </div>
        )}
        {selectedAgent && <ChatView agent={selectedAgent} />}
      </div>
    </div>
  );
}
