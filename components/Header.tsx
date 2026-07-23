import React from 'react';
import { RefreshCw, Zap, Bell, Terminal, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSyncNow: () => void;
  isSyncing: boolean;
  lastSyncTime?: string | null;
  onOpenActivationTester: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onSyncNow,
  isSyncing,
  lastSyncTime,
  onOpenActivationTester
}) => {
  return (
    <header className="h-20 bg-[#0F0F14]/90 backdrop-blur-md border-b border-gray-800/80 px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Test Code Activation API Button */}
        <button
          onClick={onOpenActivationTester}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-semibold transition-all shadow-sm"
        >
          <Terminal className="w-4 h-4 text-[#E50914]" />
          <span>Tester API Activation</span>
        </button>

        {/* Sync Now Button */}
        <button
          onClick={onSyncNow}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-red-600 hover:to-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-900/20 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser'}</span>
        </button>

        {/* System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>VIU Core v2.6 Actif</span>
        </div>
      </div>
    </header>
  );
};
