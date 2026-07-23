import React, { useState, useEffect } from 'react';
import {
  Zap,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Server,
  User,
  Key,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

interface ActivationTesterModalProps {
  initialCode?: string;
  onClose: () => void;
}

export const ActivationTesterModal: React.FC<ActivationTesterModalProps> = ({
  initialCode = '',
  onClose
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode) {
      handleTestActivation(initialCode);
    }
  }, [initialCode]);

  const handleTestActivation = async (codeToTest?: string) => {
    const targetCode = (codeToTest || code).trim();
    if (!targetCode) return;

    if (!/^\d{8}$/.test(targetCode)) {
      alert('Veuillez saisir un code à 8 chiffres.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await api.testCodeActivation(targetCode);
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Échec du test de code'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F0F14] border border-[#E50914]/40 rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>

        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/20 border border-[#E50914]/50 flex items-center justify-center text-[#E50914]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Testeur d'Activation Rapide</h3>
              <p className="text-xs text-gray-400">
                Simulation de l'API player_api.php pour codes à 8 chiffres
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Input */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-300">
            Saisir le Code d'Abonnement (8 chiffres)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={8}
              placeholder="Ex: 19877154"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleTestActivation()}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono font-bold text-base tracking-widest focus:outline-none focus:border-[#E50914]"
            />
            <button
              onClick={() => handleTestActivation()}
              disabled={loading || code.length !== 8}
              className="px-5 py-3 rounded-xl bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-900/30 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Tester</span>
            </button>
          </div>
        </div>

        {/* Results Screen */}
        {result && (
          <div className="space-y-4 pt-2">
            {result.success ? (
              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>CODE VALIDE & ACTIVATION EFFECTUÉE</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase">
                    Statut: {result.subscription.status}
                  </span>
                </div>

                {/* Xtream API Credentials Generated */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
                      <User className="w-3 h-3 text-emerald-400" /> Username Xtream
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-sm">{result.subscription.username}</span>
                      <button
                        onClick={() => copyToClipboard(result.subscription.username, 'user')}
                        className="text-gray-400 hover:text-white"
                      >
                        {copiedField === 'user' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
                      <Key className="w-3 h-3 text-emerald-400" /> Password Xtream
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-sm">{result.subscription.password}</span>
                      <button
                        onClick={() => copyToClipboard(result.subscription.password, 'pass')}
                        className="text-gray-400 hover:text-white"
                      >
                        {copiedField === 'pass' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Player API details */}
                <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-gray-400 font-semibold border-b border-gray-800 pb-1.5">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <ShieldCheck className="w-4 h-4 text-blue-400" /> Réponse API Xtream (player_api.php)
                    </span>
                    <span className="text-[10px] text-emerald-400">HTTP 200 OK</span>
                  </div>
                  <div className="font-mono text-[11px] text-gray-300 space-y-1">
                    <p>Client: <strong className="text-white">{result.subscription.client}</strong></p>
                    <p>Expiration: <strong className="text-emerald-400">{new Date(result.subscription.expires_at).toLocaleDateString('fr-FR')}</strong></p>
                    <p>Serveurs autorisés: <span className="text-gray-400">Movies #1, Series #2, Shahid #3</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                  <AlertCircle className="w-5 h-5" />
                  <span>CODE NON VALIDE OU DÉJÀ EXPIRÉ</span>
                </div>
                <p className="text-xs text-red-300/80">
                  {result.error || 'Ce code ne figure pas dans le système ou a déjà été utilisé.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
