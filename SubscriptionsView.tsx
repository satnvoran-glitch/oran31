import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  PauseCircle,
  PlayCircle,
  Clock,
  Trash2,
  Edit,
  X,
  Smartphone,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Subscription } from '../types';

export const SubscriptionsView: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Extend Modal
  const [extendingSub, setExtendingSub] = useState<Subscription | null>(null);
  const [extendMonths, setExtendMonths] = useState<number>(12);

  // Edit Modal
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.getSubscriptions(searchQuery, statusFilter);
      if (res.success) setSubscriptions(res.subscriptions);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [searchQuery, statusFilter]);

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSuspend = async (id: string) => {
    try {
      await api.updateSubscription(id, { action: 'suspend' });
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suspension');
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await api.updateSubscription(id, { action: 'reactivate' });
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la réactivation');
    }
  };

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingSub) return;
    try {
      await api.updateSubscription(extendingSub.id, {
        action: 'extend',
        durationMonths: extendMonths
      });
      setExtendingSub(null);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la prolongation');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    try {
      await api.updateSubscription(editingSub.id, {
        client: editingSub.client,
        status: editingSub.status
      });
      setEditingSub(null);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet abonnement ?')) {
      try {
        await api.deleteSubscription(id);
        fetchSubscriptions();
      } catch (err: any) {
        alert(err.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Top Header */}
      <div className="bg-[#0F0F14] p-5 rounded-2xl border border-gray-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Abonnements Utilisateurs
            </h2>
            <p className="text-xs text-gray-400">
              Gestion complète des comptes actifs, suspendus et expirés
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-400 font-medium">
          Total: <strong className="text-white">{subscriptions.length}</strong> abonnés enregistrés
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par client, username, code ou appareil..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F0F14] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'Active', 'Suspended', 'Expired'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'bg-[#0F0F14] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {st === 'all'
                ? 'Tous'
                : st === 'Active'
                ? 'Actifs'
                : st === 'Suspended'
                ? 'Suspendus'
                : 'Expirés'}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-[#0F0F14] rounded-2xl border border-gray-800/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Identifiants (User / Pass)</th>
                <th className="py-3.5 px-4">Code Utilisé</th>
                <th className="py-3.5 px-4">Dates (Activation / Expiration)</th>
                <th className="py-3.5 px-4">État</th>
                <th className="py-3.5 px-4">Device ID & Connexion</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Aucun abonnement trouvé.
                  </td>
                </tr>
              ) : (
                subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">{sub.client}</td>

                    <td className="py-4 px-4 space-y-1 font-mono">
                      <div className="text-emerald-400 font-bold">{sub.username}</div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                        <span>
                          {showPasswords[sub.id] ? sub.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(sub.id)}
                          className="text-gray-500 hover:text-white p-0.5"
                        >
                          {showPasswords[sub.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-[#E50914]">{sub.code_used}</td>

                    <td className="py-4 px-4 text-[11px] text-gray-400 space-y-0.5 font-mono">
                      <div>Actif: {new Date(sub.activated_at).toLocaleDateString('fr-FR')}</div>
                      <div className="text-red-400 font-semibold">
                        Expire: {new Date(sub.expires_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-fit uppercase ${
                          sub.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : sub.status === 'Suspended'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {sub.status === 'Active' && <UserCheck className="w-3 h-3" />}
                        {sub.status === 'Suspended' && <AlertCircle className="w-3 h-3" />}
                        {sub.status === 'Expired' && <UserX className="w-3 h-3" />}
                        {sub.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-[11px] text-gray-400 space-y-0.5">
                      <div className="flex items-center gap-1 text-gray-300 font-mono">
                        <Smartphone className="w-3 h-3 text-blue-400" /> {sub.device_id || 'Android TV'}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Dernier accès: {new Date(sub.last_connection).toLocaleTimeString('fr-FR')}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {sub.status === 'Active' ? (
                          <button
                            onClick={() => handleSuspend(sub.id)}
                            className="p-1.5 rounded-lg bg-amber-950/40 text-amber-400 hover:bg-amber-900/60"
                            title="Suspendre"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(sub.id)}
                            className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60"
                            title="Réactiver"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setExtendingSub(sub)}
                          className="p-1.5 rounded-lg bg-blue-950/40 text-blue-400 hover:bg-blue-900/60"
                          title="Prolonger"
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditingSub(sub)}
                          className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prolongation Modal */}
      {extendingSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F14] border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" /> Prolonger l'abonnement de {extendingSub.client}
              </h3>
              <button onClick={() => setExtendingSub(null)} className="p-1.5 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExtend} className="space-y-4 text-xs">
              <p className="text-gray-400">
                Expiration actuelle: <strong className="text-red-400">{new Date(extendingSub.expires_at).toLocaleDateString('fr-FR')}</strong>
              </p>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Durée à ajouter (Mois)</label>
                <select
                  value={extendMonths}
                  onChange={e => setExtendMonths(parseInt(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value={1}>+1 Mois</option>
                  <option value={3}>+3 Mois</option>
                  <option value={6}>+6 Mois</option>
                  <option value={12}>+12 Mois (1 An)</option>
                  <option value={24}>+24 Mois (2 Ans)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExtendingSub(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Confirmer la Prolongation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F14] border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#E50914]" /> Modifier l'abonné
              </h3>
              <button onClick={() => setEditingSub(null)} className="p-1.5 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Nom du Client</label>
                <input
                  type="text"
                  value={editingSub.client}
                  onChange={e => setEditingSub({ ...editingSub, client: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">État de l'abonnement</label>
                <select
                  value={editingSub.status}
                  onChange={e => setEditingSub({ ...editingSub, status: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended (Suspendu)</option>
                  <option value="Expired">Expired (Expiré)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
