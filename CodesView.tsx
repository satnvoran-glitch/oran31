import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Layers,
  Search,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit,
  X,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { SubscriptionCode } from '../types';

export const generateRandom8DigitCode = (): string => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

export const formatDurationLabel = (duration: number): string => {
  if (Math.abs(duration - 0.0333333333) < 0.005 || Math.abs(duration - 0.033) < 0.005) {
    return 'Essai 24h (1 Jour)';
  }
  if (Math.abs(duration - 0.0666666667) < 0.005 || Math.abs(duration - 0.066) < 0.005) {
    return 'Essai 48h (2 Jours)';
  }
  if (Math.abs(duration - 0.2333333333) < 0.005 || Math.abs(duration - 0.233) < 0.005) {
    return 'Essai 7 Jours';
  }
  if (duration < 1) {
    const days = Math.max(1, Math.round(duration * 30));
    return `Essai Test ${days} J`;
  }
  if (duration === 12) return '12 Mois (1 An)';
  if (duration === 24) return '24 Mois (2 Ans)';
  return `${duration} Mois`;
};

interface CodesViewProps {
  onOpenActivationTesterWithCode?: (code: string) => void;
}

export const CodesView: React.FC<CodesViewProps> = ({
  onOpenActivationTesterWithCode
}) => {
  const [codes, setCodes] = useState<SubscriptionCode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Single Code Modal
  const [showSingleModal, setShowSingleModal] = useState<boolean>(false);
  const [customCode, setCustomCode] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [duration, setDuration] = useState<number>(12);

  // Bulk Codes Modal
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkCount, setBulkCount] = useState<number>(10);
  const [bulkDuration, setBulkDuration] = useState<number>(12);
  const [bulkPrefix, setBulkPrefix] = useState<string>('Client VIP');

  // Edit Modal
  const [editingCode, setEditingCode] = useState<SubscriptionCode | null>(null);

  const handleOpenSingleModal = () => {
    setCustomCode(generateRandom8DigitCode());
    setShowSingleModal(true);
  };

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const res = await api.getCodes(searchQuery, statusFilter);
      if (res.success) setCodes(res.codes);
    } catch (err) {
      console.error('Error fetching codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [searchQuery, statusFilter]);

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCodeToUse = customCode.trim() || generateRandom8DigitCode();
    if (!/^\d{8}$/.test(finalCodeToUse)) {
      alert('Le code doit contenir exactement 8 chiffres.');
      return;
    }
    try {
      await api.createCode({
        custom_code: finalCodeToUse,
        client_name: clientName || undefined,
        duration
      });
      setShowSingleModal(false);
      setCustomCode('');
      setClientName('');
      fetchCodes();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création du code');
    }
  };

  const handleCreateBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBulkCodes({
        count: bulkCount,
        duration: bulkDuration,
        client_prefix: bulkPrefix
      });
      setShowBulkModal(false);
      fetchCodes();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la génération en lot');
    }
  };

  const handleUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode) return;
    try {
      await api.updateCode(editingCode.id, {
        client_name: editingCode.client_name,
        duration: editingCode.duration,
        status: editingCode.status
      });
      setEditingCode(null);
      fetchCodes();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce code d\'abonnement ?')) {
      try {
        await api.deleteCode(id);
        fetchCodes();
      } catch (err: any) {
        alert(err.message || 'Erreur lors de la suppression');
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.open('/api/codes/export/csv', '_blank');
  };

  // Export Excel (.xlsx) using sheetjs
  const handleExportExcel = () => {
    const formattedData = codes.map(c => ({
      Code: c.code,
      Client: c.client_name,
      'Durée': formatDurationLabel(c.duration),
      'Date Création': new Date(c.created_at).toLocaleString('fr-FR'),
      'Date Activation': c.activated_at ? new Date(c.activated_at).toLocaleString('fr-FR') : '-',
      'Date Expiration': c.expires_at ? new Date(c.expires_at).toLocaleString('fr-FR') : '-',
      Statut: c.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Codes Abonnement');
    XLSX.writeFile(workbook, `viu_codes_${Date.now()}.xlsx`);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="bg-[#0F0F14] p-5 rounded-2xl border border-gray-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center text-[#E50914]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Codes d'Abonnement (8 Chiffres)
            </h2>
            <p className="text-xs text-gray-400">
              Génération automatique, synchronisation Supabase & gestion des clés d'accès
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenSingleModal}
            className="px-3.5 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-[#E50914]/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Code</span>
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Générer en Lot</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs font-medium flex items-center gap-1"
            title="Exporter en CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-semibold flex items-center gap-1"
            title="Exporter en Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par code (8 chiffres) ou nom client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F0F14] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'Disponible', 'Utilisé', 'Expiré'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'bg-[#0F0F14] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {st === 'all' ? 'Tous les codes' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Codes Table */}
      <div className="bg-[#0F0F14] rounded-2xl border border-gray-800/80 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-900/80 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-5">Code (8 chiffres)</th>
              <th className="py-3.5 px-5">Nom du Client</th>
              <th className="py-3.5 px-5">Durée</th>
              <th className="py-3.5 px-5">Dates (Création / Activation / Expiration)</th>
              <th className="py-3.5 px-5">Statut</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-gray-300">
            {codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  Aucun code d'abonnement trouvé.
                </td>
              </tr>
            ) : (
              codes.map(code => (
                <tr key={code.id} className="hover:bg-gray-900/40 transition-colors">
                  {/* 8-Digit Code Display */}
                  <td className="py-4 px-5">
                    <span className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700/80 text-white font-mono font-bold text-sm tracking-widest text-[#E50914]">
                      {code.code}
                    </span>
                  </td>

                  <td className="py-4 px-5 font-bold text-white">{code.client_name || 'Inconnu'}</td>

                  <td className="py-4 px-5 font-semibold text-gray-300">
                    <span className={`px-2.5 py-1 rounded-md text-xs border ${
                      code.duration < 1
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-gray-800 text-gray-200 border-gray-700'
                    }`}>
                      {formatDurationLabel(code.duration)}
                    </span>
                  </td>

                  <td className="py-4 px-5 text-[11px] text-gray-400 space-y-0.5 font-mono">
                    <div>Créé: {new Date(code.created_at).toLocaleDateString('fr-FR')}</div>
                    {code.activated_at && (
                      <div className="text-emerald-400">
                        Activé: {new Date(code.activated_at).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    {code.expires_at && (
                      <div className="text-red-400">
                        Expire: {new Date(code.expires_at).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 w-fit ${
                        code.status === 'Disponible'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : code.status === 'Utilisé'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {code.status === 'Disponible' && <Clock className="w-3 h-3" />}
                      {code.status === 'Utilisé' && <CheckCircle2 className="w-3 h-3" />}
                      {code.status === 'Expiré' && <AlertCircle className="w-3 h-3" />}
                      {code.status}
                    </span>
                  </td>

                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {code.status === 'Disponible' && onOpenActivationTesterWithCode && (
                        <button
                          onClick={() => onOpenActivationTesterWithCode(code.code)}
                          className="px-2.5 py-1 rounded-lg bg-[#E50914]/20 text-[#E50914] hover:bg-[#E50914] hover:text-white text-[11px] font-bold transition-all flex items-center gap-1"
                          title="Tester activation"
                        >
                          <Zap className="w-3 h-3" /> Tester
                        </button>
                      )}
                      <button
                        onClick={() => setEditingCode(code)}
                        className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
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

      {/* Single Code Modal */}
      {showSingleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F14] border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#E50914]" />
                Créer un code d'abonnement (8 chiffres)
              </h3>
              <button onClick={() => setShowSingleModal(false)} className="p-1.5 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingle} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-gray-300 font-bold">
                    Code à 8 chiffres
                  </label>
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" /> Auto-généré
                  </span>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    maxLength={8}
                    required
                    placeholder="Ex: 84729104"
                    value={customCode}
                    onChange={e => setCustomCode(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-[#E50914]"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomCode(generateRandom8DigitCode())}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
                    title="Générer un nouveau code aléatoire de 8 chiffres"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Générer un code aléatoire</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Vous pouvez cliquer sur le bouton pour régénérer un code ou saisir votre propre code manuellement.
                </p>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Nom du Client</label>
                <input
                  type="text"
                  placeholder="Ex: Client Test Android TV"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Durée de l'abonnement</label>
                <select
                  value={duration}
                  onChange={e => setDuration(parseFloat(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#E50914] font-medium"
                >
                  <optgroup label="⚡ Codes Tests & Essais Gratuits">
                    <option value={0.0333333333}>⚡ Code Test / Essai Gratuit - 24 Heures (1 Jour)</option>
                    <option value={0.0666666667}>⚡ Code Test / Essai Gratuit - 48 Heures (2 Jours)</option>
                    <option value={0.2333333333}>⭐ Code Test / Essai Gratuit - 7 Jours (1 Semaine)</option>
                  </optgroup>
                  <optgroup label="📅 Abonnements Standards">
                    <option value={1}>1 Mois</option>
                    <option value={3}>3 Mois</option>
                    <option value={6}>6 Mois</option>
                    <option value={12}>12 Mois (1 An)</option>
                    <option value={24}>24 Mois (2 Ans)</option>
                  </optgroup>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Enregistrer dans Supabase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Codes Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F14] border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Génération de lot de codes
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="p-1.5 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBulk} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Nombre de codes à générer</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={bulkCount}
                  onChange={e => setBulkCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Préfixe du nom client</label>
                <input
                  type="text"
                  placeholder="Ex: Lot Revendeur Paris"
                  value={bulkPrefix}
                  onChange={e => setBulkPrefix(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Durée par défaut</label>
                <select
                  value={bulkDuration}
                  onChange={e => setBulkDuration(parseFloat(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                >
                  <optgroup label="⚡ Codes Tests & Essais Gratuits">
                    <option value={0.0333333333}>⚡ Code Test / Essai Gratuit - 24 Heures (1 Jour)</option>
                    <option value={0.0666666667}>⚡ Code Test / Essai Gratuit - 48 Heures (2 Jours)</option>
                    <option value={0.2333333333}>⭐ Code Test / Essai Gratuit - 7 Jours (1 Semaine)</option>
                  </optgroup>
                  <optgroup label="📅 Abonnements Standards">
                    <option value={1}>1 Mois</option>
                    <option value={3}>3 Mois</option>
                    <option value={6}>6 Mois</option>
                    <option value={12}>12 Mois (1 An)</option>
                    <option value={24}>24 Mois (2 Ans)</option>
                  </optgroup>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
                >
                  Générer {bulkCount} Codes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Code Modal */}
      {editingCode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F14] border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" />
                Modifier le code {editingCode.code}
              </h3>
              <button onClick={() => setEditingCode(null)} className="p-1.5 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCode} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Nom du Client</label>
                <input
                  type="text"
                  value={editingCode.client_name}
                  onChange={e => setEditingCode({ ...editingCode, client_name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Durée de l'abonnement</label>
                <select
                  value={editingCode.duration}
                  onChange={e => setEditingCode({ ...editingCode, duration: parseFloat(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-400 font-medium"
                >
                  <optgroup label="⚡ Codes Tests & Essais Gratuits">
                    <option value={0.0333333333}>⚡ Code Test / Essai Gratuit - 24 Heures (1 Jour)</option>
                    <option value={0.0666666667}>⚡ Code Test / Essai Gratuit - 48 Heures (2 Jours)</option>
                    <option value={0.2333333333}>⭐ Code Test / Essai Gratuit - 7 Jours (1 Semaine)</option>
                  </optgroup>
                  <optgroup label="📅 Abonnements Standards">
                    <option value={1}>1 Mois</option>
                    <option value={3}>3 Mois</option>
                    <option value={6}>6 Mois</option>
                    <option value={12}>12 Mois (1 An)</option>
                    <option value={24}>24 Mois (2 Ans)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Statut du code</label>
                <select
                  value={editingCode.status}
                  onChange={e => setEditingCode({ ...editingCode, status: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Utilisé">Utilisé</option>
                  <option value="Expiré">Expiré</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCode(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
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
