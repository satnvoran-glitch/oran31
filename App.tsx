import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { MoviesView } from './components/MoviesView';
import { SeriesView } from './components/SeriesView';
import { ShahidView } from './components/ShahidView';
import { CategoriesView } from './components/CategoriesView';
import { CodesView } from './components/CodesView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { ConfigurationView } from './components/ConfigurationView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { ActivationTesterModal } from './components/ActivationTesterModal';
import { api } from './services/api';
import { NavigationItem, SystemConfig, XtreamServerConfig } from './types';
import { Lock, ShieldCheck, Film, RefreshCw } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('viu_token');
  });

  // Login form state
  const [loginUser, setLoginUser] = useState<string>('admin');
  const [loginPass, setLoginPass] = useState<string>('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);

  // Active view state
  const [activeView, setActiveView] = useState<NavigationItem>('dashboard');

  // System config & servers
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [servers, setServers] = useState<Record<'movies' | 'series' | 'shahid', XtreamServerConfig> | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Activation tester modal
  const [showActivationModal, setShowActivationModal] = useState<boolean>(false);
  const [activationCodeToTest, setActivationCodeToTest] = useState<string>('');

  const loadConfig = async () => {
    try {
      const res = await api.getConfig();
      if (res.success) {
        setConfig(res.config);
        setServers(res.servers);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadConfig();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await api.login(loginUser, loginPass);
      if (res.success && res.token) {
        localStorage.setItem('viu_token', res.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(res.error || 'Identifiants invalides');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Échec de connexion au serveur');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('viu_token');
    setIsAuthenticated(false);
  };

  const handleGlobalSync = async () => {
    setSyncing(true);
    try {
      await api.triggerGlobalSync();
      await loadConfig();
    } catch (err) {
      console.error('Error in global sync:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateServerConfig = async (serverId: 'movies' | 'series' | 'shahid', data: Partial<XtreamServerConfig>) => {
    await api.updateServerConfig(serverId, data);
    await loadConfig();
  };

  const handleTestServerConnection = async (serverId: 'movies' | 'series' | 'shahid', data?: any) => {
    const res = await api.testServerConnection(serverId, data);
    await loadConfig();
    return res;
  };

  const handleOpenActivationTesterWithCode = (code: string) => {
    setActivationCodeToTest(code);
    setShowActivationModal(true);
  };

  // If not logged in, render high-end dark login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0E] text-gray-100 flex items-center justify-center p-4 selection:bg-[#E50914] selection:text-white">
        <div className="w-full max-w-md bg-[#0F0F14] border border-gray-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-[#E50914] to-red-600"></div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center text-[#E50914] mx-auto shadow-lg shadow-[#E50914]/10">
              <Film className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              VIU <span className="text-[#E50914]">PANEL</span>
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              Panneau d'Administration Xtream & Supabase
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Nom d'utilisateur</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  className="w-full bg-gray-900/90 border border-gray-800 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-[#E50914] transition-colors"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  className="w-full bg-gray-900/90 border border-gray-800 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-[#E50914] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-400 text-xs text-center font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs shadow-xl shadow-[#E50914]/20 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loggingIn ? 'Connexion en cours...' : 'Se connecter au VIU PANEL'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-gray-800 text-center text-[11px] text-gray-500">
            Connexion sécurisée JWT • Identifiants par défaut: <code className="text-gray-300 font-mono">admin / admin123</code>
          </div>
        </div>
      </div>
    );
  }

  // Active View Renderer
  const renderActiveView = () => {
    const handleOpenActivationModal = () => {
      setActivationCodeToTest('');
      setShowActivationModal(true);
    };

    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={setActiveView}
            onOpenActivationTester={handleOpenActivationModal}
          />
        );
      case 'movies':
        return (
          <MoviesView
            serverConfig={servers?.movies}
            onUpdateServerConfig={handleUpdateServerConfig}
            onTestConnection={handleTestServerConnection}
          />
        );
      case 'series':
        return (
          <SeriesView
            serverConfig={servers?.series}
            onUpdateServerConfig={handleUpdateServerConfig}
            onTestConnection={handleTestServerConnection}
          />
        );
      case 'shahid':
        return (
          <ShahidView
            serverConfig={servers?.shahid}
            onUpdateServerConfig={handleUpdateServerConfig}
            onTestConnection={handleTestServerConnection}
          />
        );
      case 'categories':
        return <CategoriesView />;
      case 'codes':
        return (
          <CodesView
            onOpenActivationTesterWithCode={handleOpenActivationTesterWithCode}
          />
        );
      case 'subscriptions':
        return <SubscriptionsView />;
      case 'config':
        return <ConfigurationView onConfigUpdated={loadConfig} />;
      case 'logs':
        return <ActivityLogsView />;
      default:
        return (
          <DashboardView
            onNavigate={setActiveView}
            onOpenActivationTester={handleOpenActivationModal}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-gray-100 flex selection:bg-[#E50914] selection:text-white font-sans antialiased">
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentNav={activeView}
        onSelectNav={setActiveView}
        servers={servers ?? undefined}
        onOpenActivationTester={() => {
          setActivationCodeToTest('');
          setShowActivationModal(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Responsive Area offset by Sidebar width (260px / w-64) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <Header
          title={config?.panel_name || 'VIU PANEL'}
          subtitle="Panneau d'Administration Xtream & Supabase"
          onOpenActivationTester={() => {
            setActivationCodeToTest('');
            setShowActivationModal(true);
          }}
          onSyncNow={handleGlobalSync}
          isSyncing={syncing}
        />

        {/* Page Body View */}
        <main className="flex-1 overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Activation Tester Modal */}
      {showActivationModal && (
        <ActivationTesterModal
          initialCode={activationCodeToTest}
          onClose={() => setShowActivationModal(false)}
        />
      )}
    </div>
  );
}
