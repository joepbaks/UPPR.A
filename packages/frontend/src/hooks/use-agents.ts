import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { Agent } from '../api/client';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.agents.list();
      setAgents(data);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createAgent = async (name: string, role: string) => {
    const agent = await api.agents.create({ name, role });
    setAgents((prev) => [agent, ...prev]);
    return agent;
  };

  const deleteAgent = async (id: string) => {
    await api.agents.delete(id);
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  return { agents, loading, refresh, createAgent, deleteAgent };
}
