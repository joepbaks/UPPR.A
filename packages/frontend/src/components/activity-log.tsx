import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { ActivityLogEntry } from '../api/client';

interface ActivityLogProps {
  agentId: string;
}

const TYPE_COLORS: Record<string, string> = {
  CHAT: 'bg-blue-500/20 text-blue-400',
  TOOL_USE: 'bg-purple-500/20 text-purple-400',
  AGENT_TO_AGENT: 'bg-green-500/20 text-green-400',
  TASK_EXECUTED: 'bg-yellow-500/20 text-yellow-400',
  PROMPT_UPDATED: 'bg-orange-500/20 text-orange-400',
  WEB_SEARCH: 'bg-cyan-500/20 text-cyan-400',
  ERROR: 'bg-red-500/20 text-red-400',
};

export function ActivityLog({ agentId }: ActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.activity.list(agentId).then(setLogs).finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {logs.length === 0 && (
        <div className="text-center text-gray-600 mt-20">No activity yet</div>
      )}
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 mb-3 p-3 rounded-lg bg-gray-900/50">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${TYPE_COLORS[log.type] ?? 'bg-gray-700 text-gray-400'}`}>
            {log.type}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm">{log.summary}</div>
            <div className="flex gap-3 mt-1 text-[10px] text-gray-600">
              <span>{new Date(log.createdAt).toLocaleString()}</span>
              {log.tokenCost && <span>{log.tokenCost} tokens</span>}
              {log.error && <span className="text-red-400">{log.error}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
