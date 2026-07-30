import React from 'react';
import { Database } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 shadow-2xs">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-slate-900 shadow-xs border border-slate-200">
            <img
              src="https://i.ibb.co/xqKpcbxs/14049-NPBFQY.jpg"
              alt="Nakuru Urban Heat Observatory Logo"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Nakuru Heat Intelligence
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Nakuru Urban Heat Observatory · 2021–2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-2xs">
          <Database className="h-3.5 w-3.5 text-slate-500" />
          <span>Research Knowledge Assistant</span>
        </div>
      </div>
    </header>
  );
};
