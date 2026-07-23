import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  MoveUp,
  MoveDown,
  X,
  Eye,
  EyeOff,
  Layers,
  Server,
  Film,
  Tv,
  Crown,
  CheckCircle2,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { Category } from '../types';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedServerFilter, setSelectedServerFilter] = useState<string>('all');

  // Modal create / edit
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [serverId, setServerId] = useState<'movies' | 'series' | 'shahid'>('movies');
  const [isHidden, setIsHidden] = useState<boolean>(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      if (res.success) setCategories(res.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCat(null);
    setCategoryName('');
    setServerId('movies');
    setIsHidden(false);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCat(cat);
    setCategoryName(cat.name);
    setServerId(cat.server_id || 'movies');
    setIsHidden(Boolean(cat.hidden));
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await api.updateCategory(editingCat.id, {
          name: categoryName,
          server_id: serverId,
          hidden: isHidden
        });
      } else {
        await api.createCategory({
          name: categoryName,
          server_id: serverId,
          hidden: isHidden
        });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer la catégorie "${name}" ?`)) {
      try {
        await api.deleteCategory(id);
        fetchCategories();
      } catch (err: any) {
        alert(err.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleToggleHide = async (cat: Category) => {
    try {
      const newHiddenState = !cat.hidden;
      await api.updateCategory(cat.id, { hidden: newHiddenState });
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const currentCat = categories[index];
    const targetCat = categories[targetIdx];

    try {
      await Promise.all([
        api.updateCategory(currentCat.id, { order: targetCat.order }),
        api.updateCategory(targetCat.id, { order: currentCat.order })
      ]);
      fetchCategories();
    } catch (err) {
      console.error('Error reordering categories:', err);
    }
  };

  const filteredCategories = categories.filter(cat => {
    if (selectedServerFilter === 'all') return true;
    if (selectedServerFilter === 'hidden') return cat.hidden;
    return cat.server_id === selectedServerFilter;
  });

  const getServerBadge = (id: 'movies' | 'series' | 'shahid') => {
    switch (id) {
      case 'movies':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-semibold">
            <Film className="w-3 h-3" /> Movies (Serveur 1)
          </span>
        );
      case 'series':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-semibold">
            <Tv className="w-3 h-3" /> Series (Serveur 2)
          </span>
        );
      case 'shahid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
            <Crown className="w-3 h-3" /> Shahid VIP (Serveur 3)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Top Header */}
      <div className="bg-[#0F0F14] p-6 rounded-2xl border border-gray-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E50914]/20 to-red-950/40 border border-[#E50914]/30 flex items-center justify-center text-[#E50914] shadow-lg shadow-[#E50914]/10">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Organisation des Catégories de l'Application
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Gérez les catégories personnalisées de l'interface utilisateur sans jamais stocker de vidéos dans la base de données.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-[#E50914]/20 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Catégorie</span>
        </button>
      </div>

      {/* Architecture Info Notice */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3 text-xs text-emerald-300">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-emerald-200">Architecture optimale sans stockage de films :</p>
          <p className="text-gray-300">
            Le panneau enregistre exclusivement l'agencement et l'ordre des catégories UI. Le contenu vidéo est automatiquement lu en direct depuis le serveur Xtream associé au moment de la consultation par l'utilisateur.
          </p>
        </div>
      </div>

      {/* Server Filter Tabs & Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            onClick={() => setSelectedServerFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedServerFilter === 'all'
                ? 'bg-[#E50914] text-white shadow-md shadow-red-900/30'
                : 'bg-[#0F0F14] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            Toutes les catégories ({categories.length})
          </button>
          <button
            onClick={() => setSelectedServerFilter('movies')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedServerFilter === 'movies'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#0F0F14] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movies ({categories.filter(c => c.server_id === 'movies').length})
          </button>
          <button
            onClick={() => setSelectedServerFilter('series')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedServerFilter === 'series'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#0F0F14] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5" /> Series ({categories.filter(c => c.server_id === 'series').length})
          </button>
          <button
            onClick={() => setSelectedServerFilter('shahid')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedServerFilter === 'shahid'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-[#0F0F14] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5" /> Shahid VIP ({categories.filter(c => c.server_id === 'shahid').length})
          </button>
          <button
            onClick={() => setSelectedServerFilter('hidden')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedServerFilter === 'hidden'
                ? 'bg-gray-700 text-white shadow-md'
                : 'bg-[#0F0F14] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" /> Masquées ({categories.filter(c => c.hidden).length})
          </button>
        </div>

        <span className="text-xs text-gray-400 font-mono">
          Ordre prioritaire de l'application
        </span>
      </div>

      {/* Categories Table */}
      <div className="bg-[#0F0F14] rounded-2xl border border-gray-800/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            Chargement de la configuration des catégories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderTree className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-sm font-bold text-gray-300">Aucune catégorie trouvée</p>
            <p className="text-xs text-gray-500">Cliquez sur "Créer une Catégorie" pour ajouter votre première catégorie UI.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5 w-16">Ordre</th>
                <th className="py-3.5 px-5">Nom de la Catégorie UI</th>
                <th className="py-3.5 px-5">Serveur Xtream Associé</th>
                <th className="py-3.5 px-5 text-center">Visibilité</th>
                <th className="py-3.5 px-5 text-center">Ordre / Déplacements</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {filteredCategories.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className={`hover:bg-gray-900/40 transition-colors ${
                    cat.hidden ? 'opacity-50 bg-gray-950/40' : ''
                  }`}
                >
                  <td className="py-4 px-5 font-bold font-mono text-gray-500">
                    #{cat.order || idx + 1}
                  </td>

                  <td className="py-4 px-5 font-bold text-white">
                    <div className="flex items-center gap-2.5">
                      <Layers className={`w-4 h-4 ${cat.hidden ? 'text-gray-500' : 'text-[#E50914]'}`} />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                  </td>

                  <td className="py-4 px-5">
                    {getServerBadge(cat.server_id || 'movies')}
                  </td>

                  <td className="py-4 px-5 text-center">
                    <button
                      onClick={() => handleToggleHide(cat)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        cat.hidden
                          ? 'bg-red-950/40 text-red-400 border-red-500/30 hover:bg-red-900/60'
                          : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/60'
                      }`}
                      title={cat.hidden ? 'Cliquer pour réactiver' : 'Cliquer pour masquer'}
                    >
                      {cat.hidden ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Masquée
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Visible
                        </>
                      )}
                    </button>
                  </td>

                  <td className="py-4 px-5 text-center">
                    <div className="inline-flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800">
                      <button
                        onClick={() => handleReorder(categories.findIndex(c => c.id === cat.id), 'up')}
                        disabled={categories.findIndex(c => c.id === cat.id) === 0}
                        className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-30 disabled:hover:bg-gray-800 transition-colors"
                        title="Déplacer vers le haut"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReorder(categories.findIndex(c => c.id === cat.id), 'down')}
                        disabled={categories.findIndex(c => c.id === cat.id) === categories.length - 1}
                        className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-30 disabled:hover:bg-gray-800 transition-colors"
                        title="Déplacer vers le bas"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                        title="Modifier le nom & le serveur"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-2 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition-colors"
                        title="Supprimer la catégorie"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Add/Edit Category */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F14] border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-[#E50914]" />
                {editingCat ? 'Modifier la catégorie UI' : 'Créer une catégorie UI'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Nom de la catégorie *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Action, Nouveautés, Marvel, Netflix..."
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Serveur Xtream associé *</label>
                <select
                  value={serverId}
                  onChange={e => setServerId(e.target.value as any)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                >
                  <option value="movies">Movies (Serveur 1)</option>
                  <option value="series">Series (Serveur 2)</option>
                  <option value="shahid">Shahid VIP (Serveur 3)</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Les flux diffusés dans cette catégorie proviendront en direct du serveur sélectionné.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800">
                <div>
                  <span className="font-semibold text-gray-200 block">Masquer cette catégorie</span>
                  <span className="text-[11px] text-gray-500">Ne sera pas affichée dans l'application si masquée</span>
                </div>
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={e => setIsHidden(e.target.checked)}
                  className="w-4 h-4 accent-[#E50914] rounded cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-900/30"
                >
                  {editingCat ? 'Enregistrer les modifications' : 'Créer la catégorie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
