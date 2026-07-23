import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Database,
  Key,
  Clock,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  Shield,
  Layers,
  Crown,
  Film,
  Tv
} from 'lucide-react';
import { api } from '../services/api';
import { SystemConfig, XtreamServerConfig } from '../types';
import { parseXtreamUrl, buildFullXtreamUrl } from '../utils/urlParser';

interface ConfigurationViewProps {
  onConfigUpdated: () => void;
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({
  onConfigUpdated
}) => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [servers, setServers] = useState<Record<'movies' | 'series' | 'shahid', XtreamServerConfig> | null>(null);
  const [serverUrls, setServerUrls] = useState<Record<'movies' | 'series' | 'shahid', string>>({
    movies: '',
    series: '',
    shahid: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testingServer, setTestingServer] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message?: string; error?: string }>>({});

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getConfig();
      if (res.success) {
        setConfig(res.config);
        setServers(res.servers);
        if (res.servers) {
          setServerUrls({
            movies: buildFullXtreamUrl(res.servers.movies.host, res.servers.movies.username, res.servers.movies.password, 'get_vod_streams'),
            series: buildFullXtreamUrl(res.servers.series.host, res.servers.series.username, res.servers.series.password, 'get_series'),
            shahid: buildFullXtreamUrl(res.servers.shahid.host, res.servers.shahid.username, res.servers.shahid.password, 'get_series')
          });
        }
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      setSaving(true);
      await api.updateConfig(config);
      alert('Paramètres du système enregistrés avec succès!');
      onConfigUpdated();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleServerEnabled = async (serverId: 'movies' | 'series' | 'shahid', enabled: boolean) => {
    if (!servers) return;
    const updated = { ...servers[serverId], enabled };
    setServers({ ...servers, [serverId]: updated });
    try {
      await api.updateServerConfig(serverId, { enabled });
      onConfigUpdated();
    } catch (err) {
      console.error('Error toggling server:', err);
    }
  };

  const handleSyncServer = async (serverId: 'movies' | 'series' | 'shahid') => {
    if (!servers) return;
    setTestingServer(serverId);
    setTestResults(prev => ({ ...prev, [serverId]: { success: false, message: 'Synchronisation en cours...' } }));

    const rawUrl = serverUrls[serverId] || '';
    const parsed = parseXtreamUrl(rawUrl);

    if (!parsed.isValid) {
      setTestResults(prev => ({
        ...prev,
        [serverId]: {
          success: false,
          error: parsed.error || "L'URL doit être une URL Xtream API complète contenant les paramètres username et password."
        }
      }));
      setTestingServer(null);
      return;
    }

    try {
      await api.updateServerConfig(serverId, {
        host: parsed.host,
        username: parsed.username,
        password: parsed.password
      });

      const res = await api.testServerConnection(serverId, {
        host: parsed.host,
        username: parsed.username,
        password: parsed.password
      });

      setTestResults(prev => ({
        ...prev,
        [serverId]: {
          success: res.success,
          message: res.success ? `Synchronisé avec succès (${parsed.host})` : (res.error || 'Erreur de connexion'),
          error: res.success ? undefined : res.error
        }
      }));
      fetchSettings();
      onConfigUpdated();
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [serverId]: { success: false, error: err.message || 'Échec de la connexion' }
      }));
    } finally {
      setTestingServer(null);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/config/backup', '_blank');
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async event => {
        try {
          const json = JSON.parse(event.target?.result as string);
          await api.restoreBackup(json);
          alert('Restauration système effectuée avec succès!');
          fetchSettings();
          onConfigUpdated();
        } catch (parseErr) {
          alert('Fichier JSON invalide.');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      alert('Erreur lors de la lecture du fichier.');
    }
  };

  if (loading || !config || !servers) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-[#E50914] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      {/* Title */}
      <div className="bg-[#0F0F14] p-5 rounded-2xl border border-gray-800/80 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-white">
            <Settings className="w-5 h-5 text-[#E50914]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Configuration Générale & Serveurs</h2>
            <p className="text-xs text-gray-400">
              Paramètres système, base de données Supabase, clés JWT et serveurs Xtream
            </p>
          </div>
        </div>
      </div>

      {/* 1. Xtream Servers Architecture Section */}
      <div className="bg-[#0F0F14] p-6 rounded-2xl border border-gray-800/80 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-[#E50914]" /> Architecture des Serveurs Xtream
          </h3>
          <span className="text-xs text-gray-400">3 serveurs indépendants</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Movies Server */}
          <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#E50914]" /> Server Movies
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={servers.movies.enabled}
                    onChange={e => handleToggleServerEnabled('movies', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E50914]"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[11px] text-gray-300 font-semibold block">
                  URL complète Xtream API (VOD Streams)
                </label>
                <input
                  type="text"
                  placeholder="http://kdfgh.com:8080/player_api.php?username=8182855228847187&password=8182855228847187&action=get_vod_streams"
                  value={serverUrls.movies}
                  onChange={e => setServerUrls({ ...serverUrls, movies: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#E50914]"
                />
                <p className="text-[10px] text-gray-400 leading-snug">
                  Note : L'URL doit être une URL Xtream API complète contenant les paramètres username et password.
                </p>
              </div>

              {testResults.movies && (
                <div className={`p-2 rounded-lg text-[10px] font-semibold ${testResults.movies.success ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800' : 'bg-red-950/40 text-red-400 border border-red-800'}`}>
                  {testResults.movies.success ? testResults.movies.message : testResults.movies.error}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${servers.movies.status === 'Connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {servers.movies.status}
              </span>
              <button
                onClick={() => handleSyncServer('movies')}
                disabled={testingServer === 'movies'}
                className="px-3 py-1.5 rounded-lg bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${testingServer === 'movies' ? 'animate-spin' : ''}`} />
                <span>Synchroniser maintenant</span>
              </button>
            </div>
          </div>

          {/* Series Server */}
          <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-purple-400" /> Server Series
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={servers.series.enabled}
                    onChange={e => handleToggleServerEnabled('series', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[11px] text-gray-300 font-semibold block">
                  URL complète Xtream API (Series)
                </label>
                <input
                  type="text"
                  placeholder="http://kdfgh.com:8080/player_api.php?username=8182855228847187&password=8182855228847187&action=get_series"
                  value={serverUrls.series}
                  onChange={e => setServerUrls({ ...serverUrls, series: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-gray-400 leading-snug">
                  Note : L'URL doit être une URL Xtream API complète contenant les paramètres username et password.
                </p>
              </div>

              {testResults.series && (
                <div className={`p-2 rounded-lg text-[10px] font-semibold ${testResults.series.success ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800' : 'bg-red-950/40 text-red-400 border border-red-800'}`}>
                  {testResults.series.success ? testResults.series.message : testResults.series.error}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${servers.series.status === 'Connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {servers.series.status}
              </span>
              <button
                onClick={() => handleSyncServer('series')}
                disabled={testingServer === 'series'}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${testingServer === 'series' ? 'animate-spin' : ''}`} />
                <span>Synchroniser maintenant</span>
              </button>
            </div>
          </div>

          {/* Shahid VIP Server */}
          <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" /> Server Shahid VIP
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={servers.shahid.enabled}
                    onChange={e => handleToggleServerEnabled('shahid', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[11px] text-gray-300 font-semibold block">
                  URL complète Xtream API (Shahid VIP)
                </label>
                <input
                  type="text"
                  placeholder="http://kdfgh.com:8080/player_api.php?username=8182855228847187&password=8182855228847187&action=get_series"
                  value={serverUrls.shahid}
                  onChange={e => setServerUrls({ ...serverUrls, shahid: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-gray-400 leading-snug">
                  Note : L'URL doit être une URL Xtream API complète contenant les paramètres username et password.
                </p>
              </div>

              {testResults.shahid && (
                <div className={`p-2 rounded-lg text-[10px] font-semibold ${testResults.shahid.success ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800' : 'bg-red-950/40 text-red-400 border border-red-800'}`}>
                  {testResults.shahid.success ? testResults.shahid.message : testResults.shahid.error}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${servers.shahid.status === 'Connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {servers.shahid.status}
              </span>
              <button
                onClick={() => handleSyncServer('shahid')}
                disabled={testingServer === 'shahid'}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-extrabold flex items-center gap-1 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${testingServer === 'shahid' ? 'animate-spin' : ''}`} />
                <span>Synchroniser maintenant</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. System Settings Form */}
      <form onSubmit={handleSaveConfig} className="bg-[#0F0F14] p-6 rounded-2xl border border-gray-800/80 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" /> Paramètres du Panneau VIU
          </h3>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-[#E50914]/20 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer la Configuration'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block text-gray-400 font-semibold mb-1">Nom du Panneau</label>
            <input
              type="text"
              value={config.panel_name}
              onChange={e => setConfig({ ...config, panel_name: e.target.value })}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">Fuseau Horaire (Timezone)</label>
            <select
              value={config.timezone}
              onChange={e => setConfig({ ...config, timezone: e.target.value })}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
            >
              <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
              <option value="Africa/Casablanca">Africa/Casablanca (UTC+1)</option>
              <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
              <option value="UTC">UTC Standard</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">URL Supabase (Optionnel)</label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={config.supabase_url}
              onChange={e => setConfig({ ...config, supabase_url: e.target.value })}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">Clé Supabase Anon Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
              value={config.supabase_anon_key}
              onChange={e => setConfig({ ...config, supabase_anon_key: e.target.value })}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">JWT Secret Key</label>
            <input
              type="password"
              value={config.jwt_secret}
              onChange={e => setConfig({ ...config, jwt_secret: e.target.value })}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Durée par défaut (Mois)</label>
              <input
                type="number"
                value={config.default_duration}
                onChange={e => setConfig({ ...config, default_duration: parseInt(e.target.value) || 12 })}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-1">Intervalle Sync (Minutes)</label>
              <input
                type="number"
                value={config.sync_interval}
                onChange={e => setConfig({ ...config, sync_interval: parseInt(e.target.value) || 30 })}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>
        </div>
      </form>

      {/* 3. Backup and Restore Section */}
      <div className="bg-[#0F0F14] p-6 rounded-2xl border border-gray-800/80 shadow-xl space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" /> Sauvegarde & Restauration
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Exportez l'intégralité de vos abonnements, codes et configurations en fichier JSON.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold border border-gray-700 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Télécharger la Sauvegarde (.json)</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold border border-emerald-800/60 flex items-center gap-2 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Restaurer à partir d'un fichier JSON</span>
            <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
