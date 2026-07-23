import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Trash2,
  RefreshCw,
  ShieldAlert,
  Zap,
  LogIn,
  Radio,
  Terminal
} from 'lucide-react';
import { api } from '../services/api';
import { ActivityLog } from '../types';

export const ActivityLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getLogs(typeFilter, searchQuery);
      if (res.success) setLogs(res.logs);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchQuery, typeFilter]);

  const handleClear = async () => {
    if (confirm('Voulez-vous vraiment effacer tous les journaux d\'activité ?')) {
      try {
        await api.clearLogs();
        fetchLogs();
      } catch (err: any) {
        alert(err.message || 'Erreur lors du nettoyage');
      }
    }
  };

  const getLogBadge = (type: ActivityLog['type']) => {
    switch (type) {
      case 'Activation':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
            <Zap className="w-3 h-3" /> Activation
          </span>
        );
      case 'Connexion':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 w-fit">
            <LogIn className="w-3 h-3" /> Connexion
          </span>
        );
      case 'Erreur':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit">
            <ShieldAlert className="w-3 h-3" /> Erreur
          </span>
        );
      case 'Synchronisation':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
            <Radio className="w-3 h-3" /> Synchronisation
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1 w-fit">
            <Terminal className="w-3 h-3" /> API
          </span>
        );
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Top Header */}
      <div className="bg-[#0F0F14] p-5 rounded-2xl border border-gray-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Logs d'Activité Système
            </h2>
            <p className="text-xs text-gray-400">
              Historique complet des activations, connexions, erreurs et événements Xtream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleClear}
            className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 text-xs font-bold flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Effacer les logs</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par utilisateur, IP, action ou détails..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F0F14] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 'Activation', 'Connexion', 'Erreur', 'API', 'Synchronisation'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === t
                  ? 'bg-[#E50914] text-white'
                  : 'bg-[#0F0F14] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {t === 'all' ? 'Tous les événements' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0F0F14] rounded-2xl border border-gray-800/80 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-900/80 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Date & Heure</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Action</th>
              <th className="py-3.5 px-4">Utilisateur</th>
              <th className="py-3.5 px-4">Adresse IP</th>
              <th className="py-3.5 px-4">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-gray-300">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  Aucun événement enregistré dans les journaux.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                    {new Date(log.date).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'medium'
                    })}
                  </td>

                  <td className="py-3.5 px-4">{getLogBadge(log.type)}</td>

                  <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">{log.action}</td>

                  <td className="py-3.5 px-4 font-mono text-gray-300">{log.user || 'Admin'}</td>

                  <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">{log.ip}</td>

                  <td className="py-3.5 px-4 text-gray-300 max-w-md truncate">{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
