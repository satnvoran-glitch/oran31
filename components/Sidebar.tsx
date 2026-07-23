import React from 'react';
import {
  LayoutDashboard,
  Film,
  Tv,
  Crown,
  Clapperboard,
  FolderTree,
  KeyRound,
  Users,
  Settings,
  History,
  LogOut,
  Radio,
  ShieldAlert
} from 'lucide-react';
import { NavigationItem, XtreamServerConfig } from '../types';

interface SidebarProps {
  currentNav: NavigationItem;
  onSelectNav: (nav: NavigationItem) => void;
  servers?: Record<'movies' | 'series' | 'shahid', XtreamServerConfig>;
  onOpenActivationTester: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  servers,
  onOpenActivationTester,
  onLogout
}) => {
  const navItems: { id: NavigationItem; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'categories', label: 'Catégories', icon: <FolderTree className="w-5 h-5" /> },
    { id: 'movies', label: 'Movies', icon: <Film className="w-5 h-5" />, badge: 'Server 1' },
    { id: 'series', label: 'Series', icon: <Tv className="w-5 h-5" />, badge: 'Server 2' },
    { id: 'shahid', label: 'Shahid VIP', icon: <Crown className="w-5 h-5" />, badge: 'Server 3' },
    { id: 'codes', label: "Codes d'abonnement", icon: <KeyRound className="w-5 h-5" /> },
    { id: 'subscriptions', label: 'Abonnements', icon: <Users className="w-5 h-5" /> },
    { id: 'config', label: 'Configuration', icon: <Settings className="w-5 h-5" /> },
    { id: 'logs', label: "Logs d'Activité", icon: <History className="w-5 h-5" /> }
  ];

  return (
    <aside className="w-64 bg-[#0F0F14] text-gray-300 border-r border-gray-800/80 flex flex-col fixed top-0 left-0 bottom-0 z-30 select-none">
      {/* Panel Logo & Header */}
      <div className="p-5 border-b border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#B20710] flex items-center justify-center shadow-lg shadow-[#E50914]/20 border border-red-500/30">
            <span className="font-extrabold text-white text-lg tracking-wider">V</span>
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-wide flex items-center gap-1.5">
              VIU <span className="text-[#E50914] font-extrabold">PANEL</span>
            </h1>
            <p className="text-[11px] text-gray-400 font-medium tracking-tight">Admin Xtream & Local Manager</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {navItems.map((item) => {
          const isActive = currentNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectNav(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/20 font-semibold'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110 text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md tracking-wider uppercase ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Server Health Status Panel */}
      <div className="px-4 py-3 mx-3 mb-3 bg-gray-900/90 rounded-xl border border-gray-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Serveurs Xtream
          </span>
          <button
            onClick={onOpenActivationTester}
            className="text-[11px] font-medium text-[#E50914] hover:underline"
          >
            Test API Code
          </button>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Movies Server:</span>
            <span className="flex items-center gap-1.5 text-gray-300 font-medium">
              <span className={`w-2 h-2 rounded-full ${servers?.movies?.status === 'Connected' ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-red-500'}`}></span>
              {servers?.movies?.status === 'Connected' ? 'Connecté' : 'Hors-ligne'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Series Server:</span>
            <span className="flex items-center gap-1.5 text-gray-300 font-medium">
              <span className={`w-2 h-2 rounded-full ${servers?.series?.status === 'Connected' ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-red-500'}`}></span>
              {servers?.series?.status === 'Connected' ? 'Connecté' : 'Hors-ligne'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Shahid VIP Server:</span>
            <span className="flex items-center gap-1.5 text-gray-300 font-medium">
              <span className={`w-2 h-2 rounded-full ${servers?.shahid?.status === 'Connected' ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-red-500'}`}></span>
              {servers?.shahid?.status === 'Connected' ? 'Connecté' : 'Hors-ligne'}
            </span>
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-800/80 bg-[#0B0B0E]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-xs text-white">
              AV
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">Admin VIU</p>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Administrateur
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Se déconnecter"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
