import React from 'react';
import { StatusState } from '../types';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface StatusIndicatorProps {
  status: StatusState;
  onRefresh: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, onRefresh }) => {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-700 shadow-2xs">
      <div className="flex items-center gap-2 font-medium">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            status.knowledgeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-slate-800 font-semibold">
          {status.knowledgeConnected ? 'Knowledge base connected' : 'Knowledge base disconnected'}
        </span>
      </div>

      <button
        onClick={onRefresh}
        disabled={status.loading}
        title="Check system status"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${status.loading ? 'animate-spin' : ''}`} />
        <span className="sr-only sm:not-sr-only sm:text-[11px] font-medium">Sync Status</span>
      </button>
    </div>
  );
};

