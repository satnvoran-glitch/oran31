import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  KeyRound,
  CheckCircle2,
  Server,
  RefreshCw,
  Zap,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, NavigationItem } from '../types';

interface DashboardViewProps {
  stats?: DashboardStats | null;
  loading?: boolean;
  onNavigate: (nav: NavigationItem) => void;
  onOpenActivationTester?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats: propStats,
  loading: propLoading,
  onNavigate,
  onOpenActivationTester
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(propStats || null);
  const [loading, setLoading] = useState<boolean>(propLoading ?? !propStats);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propStats) {
      fetchStats();
    } else {
      setStats(propStats);
      setLoading(propLoading ?? false);
    }
  }, [propStats, propLoading]);
  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#E50914] animate-spin" />
          <p className="text-sm font-medium text-gray-400">Chargement des statistiques du VIU PANEL...</p>
        </div>
      </div>
    );
  }

  const formattedSyncDate = stats.lastSyncTime
    ? new Date(stats.lastSyncTime).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Aucune';

  const statCards = [
    {
      title: 'Total Abonnements',
      value: stats.totalSubscriptions,
      icon: <Users className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
      badge: 'Client Subscriptions',
      nav: 'subscriptions' as NavigationItem
    },
    {
      title: 'Abonnements Actifs',
      value: stats.activeSubscriptions,
      icon: <UserCheck className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
      badge: 'En cours',
      nav: 'subscriptions' as NavigationItem
    },
    {
      title: 'Abonnements Expirés',
      value: stats.expiredSubscriptions,
      icon: <UserX className="w-6 h-6 text-red-400" />,
      color: 'from-red-500/10 to-red-600/5 border-red-500/20',
      badge: 'Expirés',
      nav: 'subscriptions' as NavigationItem
    },
    {
      title: 'Codes Disponibles',
      value: stats.availableCodes,
      icon: <KeyRound className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
      badge: 'Prêts à activer',
      nav: 'codes' as NavigationItem
    },
    {
      title: 'Codes Utilisés',
      value: stats.usedCodes,
      icon: <CheckCircle2 className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
      badge: 'Activés',
      nav: 'codes' as NavigationItem
    },
    {
      title: 'Serveurs Configurés',
      value: stats.configuredServers,
      icon: <Server className="w-6 h-6 text-rose-400" />,
      color: 'from-rose-500/10 to-rose-600/5 border-rose-500/20',
      badge: '3 Xtream Indépendants',
      nav: 'config' as NavigationItem
    }
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-[#14141B] to-[#1A0B0D] p-6 rounded-2xl border border-gray-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E50914]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] text-[11px] font-bold uppercase tracking-wider">
              Panneau Professionnel
            </span>
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Dernier sync: {formattedSyncDate}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            Bienvenue sur <span className="text-[#E50914]">VIU PANEL</span>
          </h1>
          <p className="text-xs text-gray-400 max-w-2xl">
            Gestion centralisée de vos serveurs Xtream (Movies, Series, Shahid VIP) et de votre catalogue My Movies local.
          </p>
        </div>
        <div className="flex items-center gap-3 z-10">
          <button
            onClick={onOpenActivationTester}
            className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-[#E50914]/20 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Tester API Activation</span>
          </button>
        </div>
      </div>

      {/* Primary 6 Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => onNavigate(card.nav)}
            className={`bg-gradient-to-br ${card.color} bg-[#0F0F14] p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer flex flex-col justify-between group`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400">{card.title}</span>
              <div className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800">
                {card.icon}
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-white tracking-tight">{card.value}</span>
              <span className="text-[11px] font-semibold text-gray-400 group-hover:text-white flex items-center gap-1 transition-colors">
                {card.badge} <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Server Health Status Grid */}
      <div className="bg-[#0F0F14] p-6 rounded-2xl border border-gray-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-[#E50914]" /> État des Serveurs Xtream
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">3 serveurs configurés de manière totalement indépendante</p>
          </div>
          <button
            onClick={() => onNavigate('config')}
            className="text-xs font-semibold text-[#E50914] hover:underline flex items-center gap-1"
          >
            Configurer les serveurs <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Movies Server */}
          <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Movies Server</span>
              <span className="text-[11px] text-gray-400 block">Server #1 (Films Xtream)</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                stats.serverStatuses.movies === 'Connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${stats.serverStatuses.movies === 'Connected' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              {stats.serverStatuses.movies === 'Connected' ? 'Connecté' : 'Erreur'}
            </span>
          </div>

          {/* Series Server */}
          <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Series Server</span>
              <span className="text-[11px] text-gray-400 block">Server #2 (Séries Xtream)</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                stats.serverStatuses.series === 'Connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${stats.serverStatuses.series === 'Connected' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              {stats.serverStatuses.series === 'Connected' ? 'Connecté' : 'Erreur'}
            </span>
          </div>

          {/* Shahid VIP Server */}
          <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Shahid VIP Server</span>
              <span className="text-[11px] text-gray-400 block">Server #3 (Shahid Exclusif)</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                stats.serverStatuses.shahid === 'Connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${stats.serverStatuses.shahid === 'Connected' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              {stats.serverStatuses.shahid === 'Connected' ? 'Connecté' : 'Erreur'}
            </span>
          </div>
        </div>
      </div>

      {/* Split Section: Recent Activations & Recent Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activations */}
        <div className="bg-[#0F0F14] p-6 rounded-2xl border border-gray-800/80 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> Dernières Activations
              </h3>
              <button
                onClick={() => onNavigate('subscriptions')}
                className="text-xs text-gray-400 hover:text-white font-medium"
              >
                Voir tout ({stats.totalSubscriptions})
              </button>
            </div>

            {stats.recentActivations.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">Aucune activation récente enregistrée.</p>
            ) : (
              <div className="space-y-2.5">
                {stats.recentActivations.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{sub.client}</span>
                      <span className="text-[11px] text-gray-400 font-mono">User: {sub.username} | Code: {sub.code_used}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 block mb-0.5">
                        {sub.status}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Expire: {new Date(sub.expires_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-[#0F0F14] p-6 rounded-2xl border border-gray-800/80 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" /> Dernières Erreurs
              </h3>
              <button
                onClick={() => onNavigate('logs')}
                className="text-xs text-gray-400 hover:text-white font-medium"
              >
                Consulter les logs
              </button>
            </div>

            {stats.recentErrors.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-400 font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Aucun incident ni erreur système signalé.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.recentErrors.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-300">{log.action}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(log.date).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
