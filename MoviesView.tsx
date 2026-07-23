import React, { useState, useEffect } from 'react';
import {
  Film,
  RefreshCw,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  Link,
  Layers,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { XtreamVodCategory, XtreamVodStream, XtreamServerConfig } from '../types';
import { parseXtreamUrl, buildFullXtreamUrl } from '../utils/urlParser';

interface MoviesViewProps {
  serverConfig?: XtreamServerConfig;
  onUpdateServerConfig: (serverId: 'movies', data: Partial<XtreamServerConfig>) => Promise<void>;
  onTestConnection: (serverId: 'movies', data?: any) => Promise<any>;
}

export const MoviesView: React.FC<MoviesViewProps> = ({
  serverConfig,
  onUpdateServerConfig,
  onTestConnection
}) => {
  const [categories, setCategories] = useState<XtreamVodCategory[]>([]);
  const [streams, setStreams] = useState<XtreamVodStream[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [apiUrlInput, setApiUrlInput] = useState<string>(
    buildFullXtreamUrl(serverConfig?.host, serverConfig?.username, serverConfig?.password, 'get_vod_streams')
  );
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    if (serverConfig && serverConfig.host && serverConfig.username && serverConfig.password) {
      setApiUrlInput(
        buildFullXtreamUrl(serverConfig.host, serverConfig.username, serverConfig.password, 'get_vod_streams')
      );
    }
  }, [serverConfig]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, streamRes] = await Promise.all([
        api.getXtreamMoviesCategories().catch(() => ({ success: false, categories: [] })),
        api.getXtreamMoviesStreams().catch(() => ({ success: false, streams: [] }))
      ]);

      if (catRes.success && catRes.categories) {
        setCategories(catRes.categories);
      }
      if (streamRes.success && streamRes.streams) {
        setStreams(streamRes.streams);
      }
    } catch (err) {
      console.error('Error fetching VOD stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncServer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const parsed = parseXtreamUrl(apiUrlInput);
    if (!parsed.isValid) {
      setTestResult({
        success: false,
        error: parsed.error || "L'URL doit être une URL Xtream API complète contenant les paramètres username et password."
      });
      setTesting(false);
      return;
    }

    try {
      // 1. Enregistrer Host, Username, Password dans le backend
      await onUpdateServerConfig('movies', {
        host: parsed.host,
        username: parsed.username,
        password: parsed.password
      });

      // 2. Tester la connexion et valider l'accès
      const res = await onTestConnection('movies', {
        host: parsed.host,
        username: parsed.username,
        password: parsed.password
      });

      if (res.success) {
        setTestResult({
          success: true,
          message: `Synchronisation réussie! Connexion établie avec ${parsed.host}.`
        });
        await loadData();
      } else {
        setTestResult({
          success: false,
          error: res.error || 'Impossible de se connecter au serveur Xtream.'
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Erreur lors de la synchronisation.' });
    } finally {
      setTesting(false);
    }
  };

  const isConnected = serverConfig?.status === 'Connected';

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* En-tête de la section */}
      <div className="bg-[#0F0F14] p-6 rounded-2xl border border-gray-800/80 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-[#E50914] shadow-inner">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              Movies (Serveur Xtream #1)
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-red-500/10 text-red-400 border border-red-500/20">
                Direct Xtream
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {serverConfig?.host ? `Serveur: ${serverConfig.host}` : 'Aucun serveur configuré'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            ></span>
            {isConnected ? 'Serveur Actif' : 'Non Connecté'}
          </span>

          <button
            onClick={loadData}
            disabled={loading}
            title="Rafraîchir les statistiques"
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Deux Cartes Statistiques (KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carte 1: Total Catégories */}
        <div className="bg-[#0F0F14] border border-gray-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="w-24 h-24 text-red-500" />
          </div>
          <div className="flex items-center gap-3 text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <FolderTree className="w-4 h-4" />
            </div>
            Total Catégories
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
            {loading ? (
              <span className="text-gray-500 text-2xl font-normal">Chargement...</span>
            ) : (
              categories.length.toLocaleString()
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Catégories récupérées en temps réel
          </p>
        </div>

        {/* Carte 2: Total Films */}
        <div className="bg-[#0F0F14] border border-gray-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Film className="w-24 h-24 text-red-500" />
          </div>
          <div className="flex items-center gap-3 text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Film className="w-4 h-4" />
            </div>
            Total Films
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
            {loading ? (
              <span className="text-gray-500 text-2xl font-normal">Chargement...</span>
            ) : (
              streams.length.toLocaleString()
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Films VOD consultables en streaming direct
          </p>
        </div>
      </div>

      {/* 2. Formulaire de Synchronisation (Input unique avec l'URL complète) */}
      <div className="bg-[#0F0F14] border border-gray-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="border-b border-gray-800/80 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-[#E50914]" />
            <h3 className="text-base font-bold text-white">Formulaire de Synchronisation</h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">Xtream API</span>
        </div>

        <form onSubmit={handleSyncServer} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-200">
              URL complète Xtream API (VOD Streams)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Link className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="http://kdfgh.com:8080/player_api.php?username=8182855228847187&password=8182855228847187&action=get_vod_streams"
                value={apiUrlInput}
                onChange={e => setApiUrlInput(e.target.value)}
                className="w-full bg-gray-900/90 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] font-mono text-xs transition-colors"
              />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-medium pt-1">
              Note : L'URL doit être une URL Xtream API complète contenant les paramètres username et password.
            </p>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/40 border-red-500/40 text-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{testResult.message || testResult.error}</p>
                {testResult.success && serverConfig?.username && (
                  <p className="text-[11px] text-emerald-400/80 font-mono">
                    Host: {serverConfig.host} | User: {serverConfig.username}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={testing}
              className="px-6 py-3 rounded-xl bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-900/30 flex items-center gap-2.5 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>Synchroniser maintenant</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
