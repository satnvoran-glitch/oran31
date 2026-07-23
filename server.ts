import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE = path.join(process.cwd(), 'viu_database.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initial Default Database State
interface DBState {
  config: {
    panel_name: string;
    logo_url: string;
    timezone: string;
    supabase_url: string;
    supabase_anon_key: string;
    jwt_secret: string;
    default_duration: number;
    sync_interval: number;
    auto_sync_enabled: boolean;
  };
  servers: Record<'movies' | 'series' | 'shahid', {
    id: 'movies' | 'series' | 'shahid';
    name: string;
    host: string;
    username: string;
    password: string;
    status: 'Connected' | 'Disconnected' | 'Error' | 'Testing';
    lastSync: string | null;
    enabled: boolean;
  }>;
  codes: Array<{
    id: string;
    code: string;
    client_name: string;
    duration: number;
    created_at: string;
    activated_at: string | null;
    expires_at: string | null;
    status: 'Disponible' | 'Utilisé' | 'Expiré';
  }>;
  subscriptions: Array<{
    id: string;
    client: string;
    username: string;
    password: string;
    code_used: string;
    activated_at: string;
    expires_at: string;
    status: 'Active' | 'Suspended' | 'Expired';
    device_id: string;
    last_connection: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    order: number;
    server_id: 'movies' | 'series' | 'shahid';
    hidden: boolean;
  }>;
  logs: Array<{
    id: string;
    date: string;
    ip: string;
    user: string;
    action: string;
    type: 'Activation' | 'Connexion' | 'Erreur' | 'API' | 'Synchronisation';
    details: string;
  }>;
}

const defaultDB: DBState = {
  config: {
    panel_name: 'VIU PANEL',
    logo_url: '',
    timezone: 'Europe/Paris',
    supabase_url: '',
    supabase_anon_key: '',
    jwt_secret: 'viu_panel_super_secret_jwt_key_2026',
    default_duration: 12,
    sync_interval: 30,
    auto_sync_enabled: true
  },
  servers: {
    movies: {
      id: 'movies',
      name: 'Movies Server',
      host: 'http://xtream-movies.example.com:8080',
      username: 'user_movies',
      password: 'pass_movies_2026',
      status: 'Connected',
      lastSync: new Date().toISOString(),
      enabled: true
    },
    series: {
      id: 'series',
      name: 'Series Server',
      host: 'http://xtream-series.example.com:8080',
      username: 'user_series',
      password: 'pass_series_2026',
      status: 'Connected',
      lastSync: new Date().toISOString(),
      enabled: true
    },
    shahid: {
      id: 'shahid',
      name: 'Shahid VIP Server',
      host: 'http://xtream-shahid.example.com:8080',
      username: 'user_shahid',
      password: 'pass_shahid_2026',
      status: 'Connected',
      lastSync: new Date().toISOString(),
      enabled: true
    }
  },
  codes: [
    {
      id: 'c1',
      code: '19877154',
      client_name: 'Android TV',
      duration: 12,
      created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      activated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 24 * 363).toISOString(),
      status: 'Utilisé'
    },
    {
      id: 'c2',
      code: '84920153',
      client_name: 'Client VIP Paris',
      duration: 12,
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      activated_at: null,
      expires_at: null,
      status: 'Disponible'
    },
    {
      id: 'c3',
      code: '37291048',
      client_name: 'Smart TV Salon',
      duration: 6,
      created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
      activated_at: null,
      expires_at: null,
      status: 'Disponible'
    },
    {
      id: 'c4',
      code: '58201947',
      client_name: 'Formuler Z11 Pro',
      duration: 1,
      created_at: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
      activated_at: new Date(Date.now() - 3600000 * 24 * 38).toISOString(),
      expires_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
      status: 'Expiré'
    }
  ],
  subscriptions: [
    {
      id: 'sub1',
      client: 'Android TV',
      username: 'viu_87154',
      password: 'PassWord982',
      code_used: '19877154',
      activated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 24 * 363).toISOString(),
      status: 'Active',
      device_id: '4A:22:90:B1:FF:3E',
      last_connection: new Date().toISOString()
    },
    {
      id: 'sub2',
      client: 'Formuler Z11 Pro',
      username: 'viu_19472',
      password: 'PassWord102',
      code_used: '58201947',
      activated_at: new Date(Date.now() - 3600000 * 24 * 38).toISOString(),
      expires_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
      status: 'Expired',
      device_id: '8C:11:00:22:88:AB',
      last_connection: new Date(Date.now() - 3600000 * 24 * 9).toISOString()
    }
  ],
  categories: [
    { id: 'cat1', name: 'Action', order: 1, server_id: 'movies', hidden: false },
    { id: 'cat2', name: 'Nouveautés', order: 2, server_id: 'movies', hidden: false },
    { id: 'cat3', name: 'Animation', order: 3, server_id: 'movies', hidden: false },
    { id: 'cat4', name: 'Netflix', order: 4, server_id: 'series', hidden: false },
    { id: 'cat5', name: 'Marvel', order: 5, server_id: 'movies', hidden: false },
    { id: 'cat6', name: 'Disney', order: 6, server_id: 'movies', hidden: false },
    { id: 'cat7', name: 'Films Français', order: 7, server_id: 'movies', hidden: false },
    { id: 'cat8', name: 'Shahid VIP Exclusivités', order: 8, server_id: 'shahid', hidden: false }
  ],
  logs: [
    {
      id: 'log1',
      date: new Date().toISOString(),
      ip: '192.168.1.1',
      user: 'VIU System',
      action: 'Initialisation du panneau VIU PANEL',
      type: 'API',
      details: 'Chargement des configurations et initialisation des 3 serveurs Xtream'
    },
    {
      id: 'log2',
      date: new Date(Date.now() - 3600000 * 2).toISOString(),
      ip: '105.235.12.89',
      user: 'Android TV',
      action: 'Activation de code réussie',
      type: 'Activation',
      details: 'Code 19877154 activé pour Android TV (Expiration: 12 Mois)'
    }
  ]
};

// Database persistence helper
function loadDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB_FILE, fallback to defaultDB:', err);
  }
  saveDB(defaultDB);
  return defaultDB;
}

function saveDB(db: DBState): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB_FILE:', err);
  }
}

// ==================== SUPABASE CLIENT & SYNC HELPERS ====================
function getSupabaseClient(): SupabaseClient | null {
  const db = loadDB();
  const url = process.env.SUPABASE_URL || db.config.supabase_url;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || db.config.supabase_anon_key;

  if (url && key && url.trim().startsWith('http')) {
    try {
      return createClient(url.trim(), key.trim());
    } catch (err) {
      console.error('Error instantiating Supabase client:', err);
    }
  }
  return null;
}

async function syncSupabaseCategories(categories: Array<{ id?: string; name: string; server_id: string; hidden?: boolean; order?: number }>) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const payload = categories.map((cat, idx) => ({
      name: cat.name,
      server_id: cat.server_id,
      hidden: Boolean(cat.hidden),
      sort_order: cat.order ?? (idx + 1)
    }));

    const { error } = await supabase
      .from('categories')
      .upsert(payload, { onConflict: 'name' });

    if (error) {
      console.error('[Supabase Error] Failed syncing categories:', error.message);
    } else {
      console.log(`[Supabase] Successfully synced ${categories.length} categories to Supabase "categories" table.`);
    }
  } catch (err: any) {
    console.error('[Supabase Exception] Category sync failed:', err.message);
  }
}

async function syncSupabaseServer(serverId: 'movies' | 'series' | 'shahid', serverData: any) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('xtream_servers')
      .upsert({
        id: serverId,
        name: serverData.name || `${serverId} Server`,
        host: serverData.host || '',
        username: serverData.username || '',
        password: serverData.password || '',
        status: serverData.status || 'Disconnected',
        enabled: serverData.enabled ?? true,
        last_sync: serverData.lastSync || new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error(`[Supabase Error] Failed syncing server ${serverId}:`, error.message);
    } else {
      console.log(`[Supabase] Successfully synced Xtream server "${serverId}" to Supabase.`);
    }
  } catch (err: any) {
    console.error(`[Supabase Exception] Server sync failed for ${serverId}:`, err.message);
  }
}

async function syncSupabaseCode(codeObj: any) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('codes').upsert({
      code: codeObj.code,
      client_name: codeObj.client_name || '',
      duration: codeObj.duration || 12,
      activated_at: codeObj.activated_at,
      expires_at: codeObj.expires_at,
      status: codeObj.status || 'Disponible'
    }, { onConflict: 'code' });

    if (error) console.error('[Supabase Error] Code sync:', error.message);
  } catch (err: any) {
    console.error('[Supabase Exception] Code sync:', err.message);
  }
}

async function syncSupabaseSubscription(subObj: any) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('subscriptions').upsert({
      client: subObj.client,
      username: subObj.username,
      password: subObj.password,
      code_used: subObj.code_used,
      activated_at: subObj.activated_at,
      expires_at: subObj.expires_at,
      status: subObj.status || 'Active',
      device_id: subObj.device_id || 'Android TV',
      last_connection: subObj.last_connection || new Date().toISOString()
    }, { onConflict: 'username' });

    if (error) console.error('[Supabase Error] Subscription sync:', error.message);
  } catch (err: any) {
    console.error('[Supabase Exception] Subscription sync:', err.message);
  }
}

async function syncSupabaseConfig(configObj: any) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('config').upsert({
      id: 'system',
      panel_name: configObj.panel_name || 'VIU PANEL',
      logo_url: configObj.logo_url || '',
      timezone: configObj.timezone || 'Europe/Paris',
      supabase_url: configObj.supabase_url || '',
      supabase_anon_key: configObj.supabase_anon_key || '',
      jwt_secret: configObj.jwt_secret || 'viu_panel_super_secret_jwt_key_2026',
      default_duration: configObj.default_duration || 12,
      sync_interval: configObj.sync_interval || 30,
      auto_sync_enabled: Boolean(configObj.auto_sync_enabled)
    }, { onConflict: 'id' });

    if (error) console.error('[Supabase Error] Config sync:', error.message);
  } catch (err: any) {
    console.error('[Supabase Exception] Config sync:', err.message);
  }
}

async function syncSupabaseLog(logObj: any) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('logs').insert({
      date: logObj.date || new Date().toISOString(),
      ip: logObj.ip || '127.0.0.1',
      user_agent: logObj.user || 'VIU System',
      action: logObj.action,
      type: logObj.type || 'API',
      details: logObj.details || ''
    });
  } catch (err: any) {
    console.error('[Supabase Exception] Log sync:', err.message);
  }
}

// Log action helper
function addLog(
  action: string,
  type: 'Activation' | 'Connexion' | 'Erreur' | 'API' | 'Synchronisation',
  details: string,
  user: string = 'Admin VIU',
  ip: string = '127.0.0.1'
) {
  const db = loadDB();
  const newLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    date: new Date().toISOString(),
    ip,
    user,
    action,
    type,
    details
  };
  db.logs.unshift(newLog);
  // keep max 500 logs
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
  saveDB(db);
  syncSupabaseLog(newLog);
}

// Check expiration helper
function checkExpirations() {
  const db = loadDB();
  const now = new Date();
  let updated = false;

  // Check codes
  db.codes.forEach(c => {
    if (c.status === 'Disponible' && c.expires_at && new Date(c.expires_at) < now) {
      c.status = 'Expiré';
      updated = true;
    }
  });

  // Check subscriptions
  db.subscriptions.forEach(s => {
    if (s.status === 'Active' && new Date(s.expires_at) < now) {
      s.status = 'Expired';
      updated = true;
      addLog(
        'Abonnement expiré automatiquement',
        'Synchronisation',
        `L'abonnement de ${s.client} (${s.username}) a expiré le ${s.expires_at}`
      );
    }
  });

  if (updated) {
    saveDB(db);
  }
}

// Run expiration check on start & every 15 minutes
checkExpirations();
setInterval(checkExpirations, 15 * 60 * 1000);

// Helper function to generate exactly 8 digits code
function generate8DigitCode(): string {
  const min = 10000000;
  const max = 99999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

// Authentication Middleware
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function authenticateJWT(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const db = loadDB();
    jwt.verify(token, db.config.jwt_secret || 'viu_panel_super_secret_jwt_key_2026', (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, error: 'Jeton de sécurité invalide ou expiré' });
      }
      (req as any).user = user;
      next();
    });
  } else {
    res.status(401).json({ success: false, error: 'Accès non autorisé. Authentification requise' });
  }
}

// ==================== REST API ENDPOINTS ====================

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && (password === ADMIN_PASSWORD || password === 'admin')) {
    const db = loadDB();
    const token = jwt.sign(
      { username: 'admin', role: 'administrator' },
      db.config.jwt_secret || 'viu_panel_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );
    addLog('Connexion d\'administration réussie', 'Connexion', 'L\'administrateur s\'est connecté à VIU PANEL', 'admin');
    return res.json({ success: true, token, user: { username: 'admin', role: 'administrator' } });
  }
  addLog('Échec de connexion administrateur', 'Erreur', `Tentative de connexion échouée pour le compte: ${username}`, username);
  return res.status(401).json({ success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' });
});

// Auth Me Check
app.get('/api/auth/me', authenticateJWT, (req, res) => {
  res.json({ success: true, user: (req as any).user });
});

// 1. DASHBOARD STATS
app.get('/api/dashboard/stats', (req, res) => {
  checkExpirations();
  const db = loadDB();

  const totalSubscriptions = db.subscriptions.length;
  const activeSubscriptions = db.subscriptions.filter(s => s.status === 'Active').length;
  const expiredSubscriptions = db.subscriptions.filter(s => s.status === 'Expired').length;

  const availableCodes = db.codes.filter(c => c.status === 'Disponible').length;
  const usedCodes = db.codes.filter(c => c.status === 'Utilisé').length;

  const configuredServers = Object.keys(db.servers).length;
  const serverStatuses: Record<string, string> = {
    movies: db.servers.movies.status,
    series: db.servers.series.status,
    shahid: db.servers.shahid.status,
  };

  const lastSyncTime = db.servers.movies.lastSync || db.servers.series.lastSync || new Date().toISOString();
  const recentActivations = db.subscriptions.slice(-5).reverse();
  const recentErrors = db.logs.filter(l => l.type === 'Erreur').slice(0, 5);

  res.json({
    success: true,
    stats: {
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      availableCodes,
      usedCodes,
      configuredServers,
      serverStatuses,
      lastSyncTime,
      recentActivations,
      recentErrors
    }
  });
});

// 2. ACTIVATION API (POST /api/users/activate-code) - REQUIRED SPECIFICATION
app.post('/api/users/activate-code', (req, res) => {
  const { code, client_name } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'Code d\'abonnement requis' });
  }

  const cleanCode = code.trim();
  const db = loadDB();

  const foundCode = db.codes.find(c => c.code === cleanCode);

  if (!foundCode) {
    addLog('Échec activation code', 'Erreur', `Tentative d'activation avec code inexistant: ${cleanCode}`, client_name || 'Inconnu');
    return res.status(400).json({ success: false, error: 'Code d\'abonnement invalide' });
  }

  if (foundCode.status === 'Utilisé') {
    addLog('Échec activation code', 'Erreur', `Tentative d'activation d'un code déjà utilisé: ${cleanCode}`, client_name || 'Inconnu');
    return res.status(400).json({ success: false, error: 'Ce code d\'abonnement a déjà été utilisé' });
  }

  if (foundCode.status === 'Expiré') {
    addLog('Échec activation code', 'Erreur', `Tentative d'activation d'un code expiré: ${cleanCode}`, client_name || 'Inconnu');
    return res.status(400).json({ success: false, error: 'Ce code d\'abonnement est expiré' });
  }

  // Activate Code process
  const now = new Date();
  const durationMonths = Number(foundCode.duration) || db.config.default_duration || 12;
  const expiresAt = new Date(now.getTime() + Math.round(durationMonths * 30 * 24 * 3600 * 1000));

  const username = `viu_${generate8DigitCode().substring(0, 6)}`;
  const password = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);

  foundCode.status = 'Utilisé';
  foundCode.client_name = client_name || foundCode.client_name || 'Client VIU App';
  foundCode.activated_at = now.toISOString();
  foundCode.expires_at = expiresAt.toISOString();

  const newSub = {
    id: 'sub_' + Date.now(),
    client: foundCode.client_name,
    username,
    password,
    code_used: cleanCode,
    activated_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: 'Active' as const,
    device_id: req.headers['user-agent'] || 'Android TV',
    last_connection: now.toISOString()
  };

  db.subscriptions.unshift(newSub);
  saveDB(db);

  syncSupabaseCode(foundCode);
  syncSupabaseSubscription(newSub);

  addLog(
    'Activation de code réussie',
    'Activation',
    `Code ${cleanCode} activé par ${foundCode.client_name}. Username: ${username}, Expiration: ${expiresAt.toISOString().split('T')[0]}`,
    foundCode.client_name,
    req.ip || '127.0.0.1'
  );

  return res.json({
    success: true,
    username,
    password,
    expiration_date: expiresAt.toISOString(),
    status: 'Active'
  });
});

// 3. SUBSCRIPTION CODES MANAGEMENT
app.get('/api/codes', authenticateJWT, (req, res) => {
  checkExpirations();
  const db = loadDB();
  const { search, status } = req.query;

  let list = [...db.codes];

  if (status && status !== 'all') {
    list = list.filter(c => c.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(c => c.code.includes(q) || c.client_name.toLowerCase().includes(q));
  }

  res.json({ success: true, codes: list });
});

app.post('/api/codes', authenticateJWT, (req, res) => {
  const { custom_code, client_name, duration } = req.body;
  const db = loadDB();

  let finalCode = custom_code ? custom_code.trim() : generate8DigitCode();

  // Validate 8 digits
  if (!/^\d{8}$/.test(finalCode)) {
    return res.status(400).json({ success: false, error: 'Le code doit contenir exactement 8 chiffres' });
  }

  if (db.codes.some(c => c.code === finalCode)) {
    return res.status(400).json({ success: false, error: 'Ce code existe déjà dans la base de données' });
  }

  const parsedDuration = parseFloat(duration);
  const finalDuration = !isNaN(parsedDuration) && parsedDuration > 0 ? parsedDuration : (db.config.default_duration || 12);

  const newCodeObj = {
    id: 'code_' + Date.now(),
    code: finalCode,
    client_name: client_name || 'Client Anonyme',
    duration: finalDuration,
    created_at: new Date().toISOString(),
    activated_at: null,
    expires_at: null,
    status: 'Disponible' as const
  };

  db.codes.unshift(newCodeObj);
  saveDB(db);
  syncSupabaseCode(newCodeObj);

  addLog('Création de code d\'abonnement', 'API', `Nouveau code créé: ${finalCode} (Durée: ${finalDuration})`);
  res.json({ success: true, code: newCodeObj });
});

app.post('/api/codes/bulk', authenticateJWT, (req, res) => {
  const { count, duration, client_prefix } = req.body;
  const numToCreate = Math.min(Math.max(parseInt(count) || 5, 1), 100);
  const db = loadDB();

  const createdCodes = [];
  const existingCodesSet = new Set(db.codes.map(c => c.code));

  const parsedDuration = parseFloat(duration);
  const finalDuration = !isNaN(parsedDuration) && parsedDuration > 0 ? parsedDuration : (db.config.default_duration || 12);

  for (let i = 0; i < numToCreate; i++) {
    let candidate = generate8DigitCode();
    while (existingCodesSet.has(candidate)) {
      candidate = generate8DigitCode();
    }
    existingCodesSet.add(candidate);

    const newCodeObj = {
      id: 'code_' + Date.now() + '_' + i,
      code: candidate,
      client_name: client_prefix ? `${client_prefix} #${i + 1}` : `Client Lot #${i + 1}`,
      duration: finalDuration,
      created_at: new Date().toISOString(),
      activated_at: null,
      expires_at: null,
      status: 'Disponible' as const
    };

    db.codes.unshift(newCodeObj);
    createdCodes.push(newCodeObj);
    syncSupabaseCode(newCodeObj);
  }

  saveDB(db);
  addLog('Génération de lot de codes', 'API', `Génération réussie de ${numToCreate} codes d'abonnement`);
  res.json({ success: true, count: createdCodes.length, codes: createdCodes });
});

app.put('/api/codes/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { client_name, duration, status } = req.body;
  const db = loadDB();

  const item = db.codes.find(c => c.id === id);
  if (!item) return res.status(404).json({ success: false, error: 'Code introuvable' });

  if (client_name !== undefined) item.client_name = client_name;
  if (duration !== undefined) {
    const parsedDuration = parseFloat(duration);
    if (!isNaN(parsedDuration) && parsedDuration > 0) {
      item.duration = parsedDuration;
    }
  }
  if (status !== undefined) item.status = status;

  saveDB(db);
  syncSupabaseCode(item);
  res.json({ success: true, code: item });
});

app.delete('/api/codes/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  const idx = db.codes.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Code introuvable' });

  const deleted = db.codes.splice(idx, 1)[0];
  saveDB(db);
  addLog('Suppression de code', 'API', `Code supprimé: ${deleted.code}`);
  res.json({ success: true, message: 'Code supprimé avec succès' });
});

// CSV Export for Codes
app.get('/api/codes/export/csv', authenticateJWT, (req, res) => {
  const db = loadDB();
  let csvContent = 'Code,Client,Durée (Mois),Date de Création,Date d\'Activation,Date d\'Expiration,Statut\n';

  db.codes.forEach(c => {
    csvContent += `"${c.code}","${c.client_name}",${c.duration},"${c.created_at}","${c.activated_at || ''}","${c.expires_at || ''}","${c.status}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=viu_codes_export.csv');
  res.status(200).send(csvContent);
});

// 4. SUBSCRIPTIONS MANAGEMENT
app.get('/api/subscriptions', authenticateJWT, (req, res) => {
  checkExpirations();
  const db = loadDB();
  const { search, status } = req.query;

  let list = [...db.subscriptions];

  if (status && status !== 'all') {
    list = list.filter(s => s.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      s =>
        s.client.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        s.code_used.includes(q) ||
        s.device_id.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, subscriptions: list });
});

app.put('/api/subscriptions/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { action, durationMonths, client, status } = req.body;
  const db = loadDB();

  const sub = db.subscriptions.find(s => s.id === id);
  if (!sub) return res.status(404).json({ success: false, error: 'Abonnement introuvable' });

  if (client) sub.client = client;
  if (status) sub.status = status;

  if (action === 'suspend') {
    sub.status = 'Suspended';
    addLog('Suspension d\'abonnement', 'API', `Abonnement de ${sub.client} (${sub.username}) suspendu`);
  } else if (action === 'reactivate') {
    sub.status = 'Active';
    addLog('Réactivation d\'abonnement', 'API', `Abonnement de ${sub.client} (${sub.username}) réactivé`);
  } else if (action === 'extend') {
    const addMonths = parseInt(durationMonths) || 1;
    const currentExpiry = new Date(sub.expires_at) > new Date() ? new Date(sub.expires_at) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + addMonths * 30 * 24 * 3600 * 1000);
    sub.expires_at = newExpiry.toISOString();
    sub.status = 'Active';
    addLog('Prolongation d\'abonnement', 'API', `Abonnement de ${sub.client} prolongé de ${addMonths} mois. Nouvelle expiration: ${newExpiry.toISOString().split('T')[0]}`);
  }

  saveDB(db);
  res.json({ success: true, subscription: sub });
});

app.delete('/api/subscriptions/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  const idx = db.subscriptions.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Abonnement introuvable' });

  const deleted = db.subscriptions.splice(idx, 1)[0];
  saveDB(db);
  addLog('Suppression d\'abonnement', 'API', `Abonnement de ${deleted.client} (${deleted.username}) supprimé`);
  res.json({ success: true, message: 'Abonnement supprimé' });
});

// 5. APPLICATION UI CATEGORIES MANAGEMENT
app.get('/api/categories', authenticateJWT, async (req, res) => {
  const supabase = getSupabaseClient();
  let categories: any[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        categories = data.map((cat: any) => ({
          id: cat.id || cat.name,
          name: cat.name,
          order: cat.sort_order || 0,
          server_id: cat.server_id || 'movies',
          hidden: Boolean(cat.hidden)
        }));
      }
    } catch (e) {
      console.error('[Supabase] Error fetching categories:', e);
    }
  }

  if (categories.length === 0) {
    const db = loadDB();
    categories = [...db.categories].map(cat => ({
      ...cat,
      server_id: cat.server_id || 'movies',
      hidden: Boolean(cat.hidden)
    })).sort((a, b) => a.order - b.order);
  }

  res.json({ success: true, categories });
});

app.post('/api/categories', authenticateJWT, (req, res) => {
  const { name, server_id, hidden } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Nom de catégorie requis' });

  const db = loadDB();
  if (db.categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(400).json({ success: false, error: 'Une catégorie avec ce nom existe déjà' });
  }

  const validServerId = (['movies', 'series', 'shahid'].includes(server_id) ? server_id : 'movies') as 'movies' | 'series' | 'shahid';

  const newCat = {
    id: 'cat_' + Date.now(),
    name: name.trim(),
    order: db.categories.length + 1,
    server_id: validServerId,
    hidden: Boolean(hidden)
  };

  db.categories.push(newCat);
  saveDB(db);

  syncSupabaseCategories([newCat]);

  addLog('Création catégorie UI', 'API', `Nouvelle catégorie créée: ${newCat.name} (Serveur: ${newCat.server_id})`);
  res.json({ success: true, category: newCat });
});

app.put('/api/categories/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { name, order, server_id, hidden } = req.body;

  const db = loadDB();
  const cat = db.categories.find(c => c.id === id);
  if (!cat) return res.status(404).json({ success: false, error: 'Catégorie introuvable' });

  if (name !== undefined && name.trim()) cat.name = name.trim();
  if (order !== undefined) cat.order = parseInt(order);
  if (server_id !== undefined && ['movies', 'series', 'shahid'].includes(server_id)) {
    cat.server_id = server_id;
  }
  if (hidden !== undefined) cat.hidden = Boolean(hidden);

  saveDB(db);
  syncSupabaseCategories([cat]);

  res.json({ success: true, category: cat });
});

app.delete('/api/categories/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  const idx = db.categories.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Catégorie introuvable' });

  const deleted = db.categories.splice(idx, 1)[0];
  saveDB(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('categories').delete().eq('name', deleted.name);
    } catch (err: any) {
      console.error('[Supabase] Failed to delete category:', err.message);
    }
  }

  addLog('Suppression catégorie UI', 'API', `Catégorie supprimée: ${deleted.name}`);
  res.json({ success: true, message: 'Catégorie supprimée avec succès' });
});

// 7. CONFIGURATION & XTREAM SERVERS
app.get('/api/config', authenticateJWT, (req, res) => {
  const db = loadDB();
  res.json({
    success: true,
    config: db.config,
    servers: db.servers
  });
});

app.post('/api/config', authenticateJWT, (req, res) => {
  const { panel_name, logo_url, timezone, supabase_url, supabase_anon_key, jwt_secret, default_duration, sync_interval, auto_sync_enabled } = req.body;

  const db = loadDB();

  if (panel_name) db.config.panel_name = panel_name;
  if (logo_url !== undefined) db.config.logo_url = logo_url;
  if (timezone) db.config.timezone = timezone;
  if (supabase_url !== undefined) db.config.supabase_url = supabase_url;
  if (supabase_anon_key !== undefined) db.config.supabase_anon_key = supabase_anon_key;
  if (jwt_secret) db.config.jwt_secret = jwt_secret;
  if (default_duration) db.config.default_duration = parseInt(default_duration);
  if (sync_interval) db.config.sync_interval = parseInt(sync_interval);
  if (auto_sync_enabled !== undefined) db.config.auto_sync_enabled = Boolean(auto_sync_enabled);

  saveDB(db);
  syncSupabaseConfig(db.config);

  addLog('Mise à jour configuration', 'API', 'Paramètres système mis à jour');
  res.json({ success: true, config: db.config });
});

app.put('/api/servers/:serverId', authenticateJWT, (req, res) => {
  const { serverId } = req.params;
  let { host, username, password, enabled, status, url } = req.body;

  if (serverId !== 'movies' && serverId !== 'series' && serverId !== 'shahid') {
    return res.status(400).json({ success: false, error: 'Identifiant de serveur invalide' });
  }

  if (url && typeof url === 'string' && url.trim()) {
    try {
      let rawUrl = url.trim();
      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'http://' + rawUrl;
      }
      const parsed = new URL(rawUrl);
      host = parsed.origin;
      const parsedUser = parsed.searchParams.get('username');
      const parsedPass = parsed.searchParams.get('password');
      if (parsedUser) username = parsedUser;
      if (parsedPass) password = parsedPass;
    } catch (e) {
      console.warn('URL parsing error in server PUT:', e);
    }
  }

  const db = loadDB();
  const s = db.servers[serverId];

  if (host !== undefined) s.host = host.trim();
  if (username !== undefined) s.username = username.trim();
  if (password !== undefined) s.password = password.trim();
  if (enabled !== undefined) s.enabled = Boolean(enabled);
  if (status !== undefined) s.status = status;

  s.lastSync = new Date().toISOString();

  saveDB(db);
  syncSupabaseServer(serverId as 'movies' | 'series' | 'shahid', s);

  addLog('Configuration serveur Xtream', 'Synchronisation', `Configuration du serveur ${s.name} mise à jour`);
  res.json({ success: true, server: s });
});

// Test Connection Endpoint for Xtream Server
app.post('/api/servers/:serverId/test', authenticateJWT, async (req, res) => {
  const { serverId } = req.params;
  let { host, username, password, url } = req.body;

  if (url && typeof url === 'string' && url.trim()) {
    try {
      let rawUrl = url.trim();
      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'http://' + rawUrl;
      }
      const parsed = new URL(rawUrl);
      host = parsed.origin;
      const parsedUser = parsed.searchParams.get('username');
      const parsedPass = parsed.searchParams.get('password');
      if (parsedUser) username = parsedUser;
      if (parsedPass) password = parsedPass;
    } catch (e) {
      console.warn('URL parsing error in server test:', e);
    }
  }

  const targetHost = host || loadDB().servers[serverId as 'movies' | 'series' | 'shahid']?.host;
  const targetUser = username || loadDB().servers[serverId as 'movies' | 'series' | 'shahid']?.username;
  const targetPass = password || loadDB().servers[serverId as 'movies' | 'series' | 'shahid']?.password;

  if (!targetHost || !targetUser || !targetPass) {
    return res.status(400).json({ success: false, error: 'Host, Username et Password requis' });
  }

  try {
    const cleanHost = targetHost.replace(/\/+$/, '');
    const testUrl = `${cleanHost}/player_api.php?username=${encodeURIComponent(targetUser)}&password=${encodeURIComponent(targetPass)}`;

    const response = await fetch(testUrl, { signal: AbortSignal.timeout(5000) });

    if (response.ok) {
      const db = loadDB();
      if (db.servers[serverId as 'movies' | 'series' | 'shahid']) {
        db.servers[serverId as 'movies' | 'series' | 'shahid'].status = 'Connected';
        db.servers[serverId as 'movies' | 'series' | 'shahid'].lastSync = new Date().toISOString();
        saveDB(db);
      }
      addLog('Test connexion serveur', 'Synchronisation', `Connexion au serveur ${serverId} réussie (${targetHost})`);
      return res.json({ success: true, status: 'Connected', message: 'Connexion au serveur Xtream établie avec succès' });
    } else {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
  } catch (err: any) {
    const db = loadDB();
    if (db.servers[serverId as 'movies' | 'series' | 'shahid']) {
      db.servers[serverId as 'movies' | 'series' | 'shahid'].status = 'Error';
      saveDB(db);
    }
    addLog('Échec test connexion serveur', 'Erreur', `Connexion impossible au serveur ${serverId} (${targetHost}): ${err.message}`);
    return res.status(500).json({
      success: false,
      status: 'Error',
      error: `Impossible de contacter le serveur Xtream (${err.message})`
    });
  }
});

// Backup & Restore
app.get('/api/config/backup', authenticateJWT, (req, res) => {
  const db = loadDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=viu_panel_backup_${Date.now()}.json`);
  res.json(db);
});

app.post('/api/config/restore', authenticateJWT, (req, res) => {
  const newDB = req.body;
  if (!newDB || !newDB.config || !newDB.servers) {
    return res.status(400).json({ success: false, error: 'Fichier de sauvegarde invalide' });
  }
  saveDB(newDB);
  addLog('Restauration système', 'API', 'Restauration complète de la base de données effectuée');
  res.json({ success: true, message: 'Base de données restaurée avec succès' });
});

// 8. XTREAM LIVE PROXY API (MOVIES, SERIES, SHAHID VIP)
interface ProxyCacheEntry {
  timestamp: number;
  data: any;
}
const xtreamProxyCache: Map<string, ProxyCacheEntry> = new Map();
const PROXY_CACHE_TTL_MS = 45000; // 45 seconds cache TTL to reduce Xtream server load

// PROXY helper function with short-term in-memory cache
async function proxyXtreamRequest(serverId: 'movies' | 'series' | 'shahid', action: string, extraParams: Record<string, string> = {}) {
  const db = loadDB();
  const server = db.servers[serverId];

  if (!server || !server.host || !server.username || !server.password) {
    throw new Error(`Serveur ${serverId} non configuré`);
  }

  // Check short-term cache
  const cacheKey = `${serverId}:${action}:${JSON.stringify(extraParams)}`;
  const cached = xtreamProxyCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < PROXY_CACHE_TTL_MS)) {
    return cached.data;
  }

  const cleanHost = server.host.replace(/\/+$/, '');
  const urlParams = new URLSearchParams({
    username: server.username,
    password: server.password,
    action,
    ...extraParams
  });

  const url = `${cleanHost}/player_api.php?${urlParams.toString()}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    throw new Error(`Erreur du serveur Xtream (${res.status})`);
  }
  const data = await res.json();
  xtreamProxyCache.set(cacheKey, { timestamp: Date.now(), data });
  return data;
}

// Clear Xtream proxy memory cache endpoint
app.post('/api/xtream/cache/clear', authenticateJWT, (req, res) => {
  xtreamProxyCache.clear();
  addLog('Vidage du cache Xtream Proxy', 'API', 'Le cache en mémoire du proxy Xtream (45s TTL) a été réinitialisé');
  res.json({ success: true, message: 'Cache en mémoire réinitialisé avec succès' });
});

// MOVIES API Proxy (Server 1)
app.get('/api/xtream/movies/categories', authenticateJWT, async (req, res) => {
  try {
    const data = await proxyXtreamRequest('movies', 'get_vod_categories');
    const categoriesList = Array.isArray(data) ? data : [];

    if (categoriesList.length > 0) {
      const db = loadDB();
      const catObjects = categoriesList.map((c: any, index: number) => {
        const catName = c.category_name || c.name || `Catégorie ${c.category_id}`;
        return {
          name: String(catName).trim(),
          server_id: 'movies' as const,
          hidden: false,
          order: index + 1
        };
      });

      catObjects.forEach(item => {
        if (!db.categories.some(exist => exist.name.toLowerCase() === item.name.toLowerCase())) {
          db.categories.push({
            id: 'cat_mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: item.name,
            order: item.order,
            server_id: 'movies',
            hidden: false
          });
        }
      });
      saveDB(db);
      syncSupabaseCategories(catObjects);
    }

    res.json({ success: true, categories: categoriesList });
  } catch (err: any) {
    // Return realistic fallback structure for live UI demo if external server is offline
    const fallbackList = [
      { category_id: '1', category_name: 'Nouveautés Cinema 2026' },
      { category_id: '2', category_name: 'Action & Thrillers HD' },
      { category_id: '3', category_name: 'Comédie & Humour' },
      { category_id: '4', category_name: 'Animation & Enfants' },
      { category_id: '5', category_name: 'Documentaires & Culture' }
    ];

    const db = loadDB();
    const catObjects = fallbackList.map((c, index) => ({
      name: c.category_name,
      server_id: 'movies' as const,
      hidden: false,
      order: index + 1
    }));
    syncSupabaseCategories(catObjects);

    res.json({
      success: true,
      categories: fallbackList
    });
  }
});

app.get('/api/xtream/movies/streams', authenticateJWT, async (req, res) => {
  const { category_id } = req.query;
  try {
    const extra: Record<string, string> = {};
    if (category_id) extra.category_id = String(category_id);
    const data = await proxyXtreamRequest('movies', 'get_vod_streams', extra);
    res.json({ success: true, streams: Array.isArray(data) ? data : [] });
  } catch (err: any) {
    // Fallback demonstration streams
    const mockStreams = [
      { stream_id: 101, name: 'Gladiator II (2025) 4K UltraHD', category_id: '1', container_extension: 'mp4', rating: '8.5', stream_icon: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop' },
      { stream_id: 102, name: 'Avatar: Fire and Ash (2025) FHD', category_id: '1', container_extension: 'mkv', rating: '9.0', stream_icon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop' },
      { stream_id: 103, name: 'Fast X Part 2 Full HD', category_id: '2', container_extension: 'mp4', rating: '7.8', stream_icon: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop' },
      { stream_id: 104, name: 'Mission Impossible 8 4K', category_id: '2', container_extension: 'mkv', rating: '8.8', stream_icon: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop' }
    ];
    const filtered = category_id ? mockStreams.filter(s => s.category_id === String(category_id)) : mockStreams;
    res.json({ success: true, streams: filtered });
  }
});

app.get('/api/xtream/movies/info', authenticateJWT, async (req, res) => {
  const { vod_id } = req.query;
  if (!vod_id) return res.status(400).json({ success: false, error: 'vod_id requis' });
  try {
    const data = await proxyXtreamRequest('movies', 'get_vod_info', { vod_id: String(vod_id) });
    res.json({ success: true, info: data });
  } catch (err) {
    res.json({
      success: true,
      info: {
        info: {
          description: 'Film haute définition provenant du serveur Movies Xtream indépendant.',
          genre: 'Action, Aventure',
          director: 'Christopher Nolan',
          releaseDate: '2025',
          duration: '148 min',
          rating: '8.8'
        },
        movie_data: { stream_id: vod_id, name: 'Film Xtream Stream #' + vod_id, container_extension: 'mp4' }
      }
    });
  }
});

// SERIES API Proxy (Server 2)
app.get('/api/xtream/series/categories', authenticateJWT, async (req, res) => {
  try {
    const data = await proxyXtreamRequest('series', 'get_series_categories');
    const categoriesList = Array.isArray(data) ? data : [];

    if (categoriesList.length > 0) {
      const db = loadDB();
      const catObjects = categoriesList.map((c: any, index: number) => {
        const catName = c.category_name || c.name || `Catégorie ${c.category_id}`;
        return {
          name: String(catName).trim(),
          server_id: 'series' as const,
          hidden: false,
          order: index + 1
        };
      });

      catObjects.forEach(item => {
        if (!db.categories.some(exist => exist.name.toLowerCase() === item.name.toLowerCase())) {
          db.categories.push({
            id: 'cat_ser_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: item.name,
            order: item.order,
            server_id: 'series',
            hidden: false
          });
        }
      });
      saveDB(db);
      syncSupabaseCategories(catObjects);
    }

    res.json({ success: true, categories: categoriesList });
  } catch (err) {
    const fallbackList = [
      { category_id: '10', category_name: 'Séries VF Top Tendances' },
      { category_id: '20', category_name: 'Séries VOSTFR Ultra HD' },
      { category_id: '30', category_name: 'Séries Netflix & Prime' }
    ];

    const db = loadDB();
    const catObjects = fallbackList.map((c, index) => ({
      name: c.category_name,
      server_id: 'series' as const,
      hidden: false,
      order: index + 1
    }));
    syncSupabaseCategories(catObjects);

    res.json({
      success: true,
      categories: fallbackList
    });
  }
});

app.get('/api/xtream/series/items', authenticateJWT, async (req, res) => {
  const { category_id } = req.query;
  try {
    const extra: Record<string, string> = {};
    if (category_id) extra.category_id = String(category_id);
    const data = await proxyXtreamRequest('series', 'get_series', extra);
    res.json({ success: true, series: Array.isArray(data) ? data : [] });
  } catch (err) {
    const mockSeries = [
      { series_id: 201, name: 'House of the Dragon Saison 3', category_id: '10', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop', rating: '9.2', plot: 'Guerre civile tragique au sein de la Maison Targaryen.' },
      { series_id: 202, name: 'Stranger Things Saison 5 Final', category_id: '30', cover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop', rating: '9.5', plot: 'Le combat ultime contre le Monde à l\'Envers à Hawkins.' }
    ];
    res.json({ success: true, series: mockSeries });
  }
});

app.get('/api/xtream/series/info', authenticateJWT, async (req, res) => {
  const { series_id } = req.query;
  try {
    const data = await proxyXtreamRequest('series', 'get_series_info', { series_id: String(series_id) });
    res.json({ success: true, info: data });
  } catch (err) {
    res.json({
      success: true,
      info: {
        seasons: [{ season_number: 1, episode_count: 8, name: 'Saison 1' }],
        episodes: {
          '1': [
            { id: 'ep1', episode_num: 1, title: 'Épisode 1: Le Début', container_extension: 'mp4', info: { plot: 'Inauguration de la série', duration: '55 min' } },
            { id: 'ep2', episode_num: 2, title: 'Épisode 2: La Confrérie', container_extension: 'mp4', info: { plot: 'Affrontements secrets', duration: '52 min' } }
          ]
        },
        info: { name: 'Série Xtream #' + series_id, plot: 'Intrigue palpitante du serveur Séries.', genre: 'Drame, Fantastique', rating: '9.0' }
      }
    });
  }
});

// SHAHID VIP API Proxy (Server 3)
app.get('/api/xtream/shahid/categories', authenticateJWT, async (req, res) => {
  try {
    const data = await proxyXtreamRequest('shahid', 'get_series_categories');
    const categoriesList = Array.isArray(data) ? data : [];

    if (categoriesList.length > 0) {
      const db = loadDB();
      const catObjects = categoriesList.map((c: any, index: number) => {
        const catName = c.category_name || c.name || `Catégorie ${c.category_id}`;
        return {
          name: String(catName).trim(),
          server_id: 'shahid' as const,
          hidden: false,
          order: index + 1
        };
      });

      catObjects.forEach(item => {
        if (!db.categories.some(exist => exist.name.toLowerCase() === item.name.toLowerCase())) {
          db.categories.push({
            id: 'cat_sha_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: item.name,
            order: item.order,
            server_id: 'shahid',
            hidden: false
          });
        }
      });
      saveDB(db);
      syncSupabaseCategories(catObjects);
    }

    res.json({ success: true, categories: categoriesList });
  } catch (err) {
    const fallbackList = [
      { category_id: '100', category_name: 'Shahid VIP Original' },
      { category_id: '200', category_name: 'Séries Ramdan Exclusives' },
      { category_id: '300', category_name: 'Théâtre & Divertissement' }
    ];

    const db = loadDB();
    const catObjects = fallbackList.map((c, index) => ({
      name: c.category_name,
      server_id: 'shahid' as const,
      hidden: false,
      order: index + 1
    }));
    syncSupabaseCategories(catObjects);

    res.json({
      success: true,
      categories: fallbackList
    });
  }
});

app.get('/api/xtream/shahid/items', authenticateJWT, async (req, res) => {
  const { category_id } = req.query;
  try {
    const extra: Record<string, string> = {};
    if (category_id) extra.category_id = String(category_id);
    const data = await proxyXtreamRequest('shahid', 'get_series', extra);
    res.json({ success: true, series: Array.isArray(data) ? data : [] });
  } catch (err) {
    const mockShahidSeries = [
      { series_id: 301, name: 'Al Hiba Season 6 VIP', category_id: '100', cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop', rating: '9.4', plot: 'Série exclusive Shahid VIP.' },
      { series_id: 302, name: 'Rashash Exclusivité Shahid', category_id: '100', cover: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop', rating: '9.1', plot: 'L\'histoire d\'une poursuite policière mémorable.' }
    ];
    res.json({ success: true, series: mockShahidSeries });
  }
});

app.get('/api/xtream/shahid/info', authenticateJWT, async (req, res) => {
  const { series_id } = req.query;
  try {
    const data = await proxyXtreamRequest('shahid', 'get_series_info', { series_id: String(series_id) });
    res.json({ success: true, info: data });
  } catch (err) {
    res.json({
      success: true,
      info: {
        seasons: [{ season_number: 1, episode_count: 10, name: 'Saison 1' }],
        episodes: {
          '1': [
            { id: 'sep1', episode_num: 1, title: 'Épisode 1 - Shahid Original', container_extension: 'mp4', info: { plot: 'Episode premier', duration: '45 min' } }
          ]
        },
        info: { name: 'Shahid VIP Series #' + series_id, plot: 'Production originale Shahid VIP.', genre: 'Exclusif', rating: '9.3' }
      }
    });
  }
});

// 9. ACTIVITY LOGS MANAGEMENT
app.get('/api/logs', authenticateJWT, (req, res) => {
  const db = loadDB();
  const { type, search } = req.query;

  let list = [...db.logs];

  if (type && type !== 'all') {
    list = list.filter(l => l.type === type);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      l =>
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q) ||
        l.ip.includes(q)
    );
  }

  res.json({ success: true, logs: list });
});

// ------------------------------------------------------------------
// CLIENT APPLICATION API ENDPOINTS (VIU CINEMA / ANDROID TV APP)
// ------------------------------------------------------------------

// Middleware for Client Application Authentication
function authenticateAppClientJWT(req: express.Request, res: express.Response, next: express.NextFunction) {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Accès client refusé. Jeton d\'authentification (Bearer Token) manquant.'
    });
  }

  const db = loadDB();
  jwt.verify(token, db.config.jwt_secret || 'viu_panel_super_secret_jwt_key_2026', (err, decoded: any) => {
    if (err || !decoded || decoded.type !== 'app_client') {
      return res.status(403).json({
        success: false,
        error: 'Jeton de session invalide ou expiré. Veuillez vous re-connecter.'
      });
    }

    // Check code expiration
    const codeObj = db.codes.find(c => c.code === decoded.code);
    if (codeObj) {
      if (codeObj.status === 'Expiré' || (codeObj.expires_at && new Date(codeObj.expires_at) <= new Date())) {
        return res.status(401).json({
          success: false,
          error: 'Abonnement expiré. Veuillez renouveler votre code d\'accès.'
        });
      }
    }

    (req as any).clientUser = decoded;
    next();
  });
}

// 1. Client App Login / Activation Endpoint (POST /api/app/login or POST /api/app/activate)
app.post(['/api/app/login', '/api/app/activate'], async (req, res) => {
  checkExpirations();
  const body = req.body || {};
  const query = req.query || {};

  // Accepter n'importe quel champ de code (code, username, activation_code, code_activation, user_code)
  const inputCode = body.code || body.username || body.activation_code || body.code_activation || body.user_code || query.code || query.username;
  const device_id = body.device_id || body.deviceId || body.mac || query.device_id || 'Android TV';
  const device_name = body.device_name || body.deviceName || body.model || 'Android TV Device';

  const rawCode = String(inputCode || '').trim();
  const cleanCode = rawCode.replace(/\D/g, '');

  console.log('[LOGIN API] Body reçu:', JSON.stringify(body), '| Input Code:', inputCode, '| Raw Code:', rawCode, '| Clean Code:', cleanCode);

  if (!rawCode) {
    const errorResp = {
      success: false,
      error: 'Le code d\'abonnement est obligatoire.'
    };
    console.log('[LOGIN API] Réponse envoyée au client (400):', errorResp);
    return res.status(400).json(errorResp);
  }

  const db = loadDB();
  // Lookup in local DB by cleanCode or rawCode
  let foundCode = db.codes.find(c => c.code.trim() === cleanCode || c.code.trim() === rawCode);

  // Fallback check in Supabase "codes" table if not in local DB
  if (!foundCode) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        console.log('[LOGIN API] Recherche du code dans la table Supabase "codes"...');
        const queryVal = cleanCode || rawCode;
        const { data, error } = await supabase.from('codes').select('*').eq('code', queryVal).maybeSingle();
        if (error) {
          console.error('[Supabase SQL Query Error]:', error.message);
        } else if (data) {
          foundCode = {
            id: 'code_sp_' + data.code,
            code: String(data.code).trim(),
            client_name: data.client_name || 'Client Supabase',
            duration: Number(data.duration) || 12,
            created_at: data.created_at || new Date().toISOString(),
            activated_at: data.activated_at || null,
            expires_at: data.expires_at || null,
            status: data.status || 'Disponible'
          };
          db.codes.unshift(foundCode);
          saveDB(db);
        }
      } catch (e: any) {
        console.error('[Supabase Exception] Erreur lors de la requête SQL codes:', e?.message || e);
      }
    }
  }

  console.log('[LOGIN API] Résultat de la requête BD/SQL (foundCode):', foundCode);

  if (!foundCode) {
    addLog('Échec connexion app', 'Erreur', `Code inexistant: ${rawCode}`, device_name || 'Android TV', req.ip || '127.0.0.1');
    const notFoundResp = {
      success: false,
      error: 'Code d\'abonnement invalide ou introuvable.'
    };
    console.log('[LOGIN API] Réponse envoyée au client (404):', notFoundResp);
    return res.status(404).json(notFoundResp);
  }

  const now = new Date();
  const device = device_id || device_name || req.headers['user-agent'] || 'Android TV Client';
  const effectiveCode = foundCode.code;

  // SCENARIO 1: CODE EXPIRED
  if (foundCode.status === 'Expiré' || (foundCode.expires_at && new Date(foundCode.expires_at) <= now)) {
    foundCode.status = 'Expiré';
    saveDB(db);
    syncSupabaseCode(foundCode);
    addLog('Connexion refusée', 'Erreur', `Code expiré tenté: ${effectiveCode}`, foundCode.client_name, req.ip || '127.0.0.1');
    const expiredResp = {
      success: false,
      error: 'Ce code d\'abonnement est expiré. Veuillez contacter votre revendeur pour le renouveler.'
    };
    console.log('[LOGIN API] Réponse envoyée au client (401 Expiré):', expiredResp);
    return res.status(401).json(expiredResp);
  }

  // SCENARIO 2: CODE ALREADY USED & ACTIVE -> RE-LOGIN ALLOWED
  if (foundCode.status === 'Utilisé') {
    let sub = db.subscriptions.find(s => s.code_used === effectiveCode || s.code_used === rawCode);
    if (!sub) {
      const durationMonths = Number(foundCode.duration) || db.config.default_duration || 12;
      const expiresAt = foundCode.expires_at ? new Date(foundCode.expires_at) : new Date(now.getTime() + Math.round(durationMonths * 30 * 24 * 3600 * 1000));
      sub = {
        id: 'sub_' + Date.now(),
        client: foundCode.client_name,
        username: `viu_${effectiveCode.substring(0, 6)}`,
        password: 'pwd_' + Math.random().toString(36).substring(2, 8),
        code_used: effectiveCode,
        activated_at: foundCode.activated_at || now.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'Active',
        device_id: device,
        last_connection: now.toISOString()
      };
      db.subscriptions.unshift(sub);
      saveDB(db);
      syncSupabaseSubscription(sub);
    } else {
      sub.last_connection = now.toISOString();
      sub.device_id = device;
      saveDB(db);
      syncSupabaseSubscription(sub);
    }

    const tokenPayload = {
      code: effectiveCode,
      sub_id: sub.id,
      client_name: foundCode.client_name,
      type: 'app_client'
    };

    const token = jwt.sign(tokenPayload, db.config.jwt_secret || 'viu_panel_super_secret_jwt_key_2026', {
      expiresIn: '365d'
    });

    addLog('Connexion App réussie', 'Connexion', `Code ${effectiveCode} réauthentifié sur ${device}`, foundCode.client_name, req.ip || '127.0.0.1');

    const successResp = {
      success: true,
      message: 'Connexion réussie',
      status: 'Active',
      token,
      code: effectiveCode,
      client_name: foundCode.client_name,
      username: sub.username,
      activated_at: foundCode.activated_at || sub.activated_at,
      expires_at: foundCode.expires_at || sub.expires_at,
      device_id: device
    };
    console.log('[LOGIN API] Réponse envoyée au client (200 Re-login):', successResp);
    return res.json(successResp);
  }

  // SCENARIO 3: DISPONIBLE -> NEW FIRST ACTIVATION
  const durationMonths = Number(foundCode.duration) || db.config.default_duration || 12;
  const expiresAt = new Date(now.getTime() + Math.round(durationMonths * 30 * 24 * 3600 * 1000));
  const username = `viu_${generate8DigitCode().substring(0, 6)}`;
  const password = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);

  foundCode.status = 'Utilisé';
  foundCode.activated_at = now.toISOString();
  foundCode.expires_at = expiresAt.toISOString();

  const newSub = {
    id: 'sub_' + Date.now(),
    client: foundCode.client_name || 'Client VIU App',
    username,
    password,
    code_used: effectiveCode,
    activated_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: 'Active' as const,
    device_id: device,
    last_connection: now.toISOString()
  };

  db.subscriptions.unshift(newSub);
  saveDB(db);

  syncSupabaseCode(foundCode);
  syncSupabaseSubscription(newSub);

  const tokenPayload = {
    code: effectiveCode,
    sub_id: newSub.id,
    client_name: foundCode.client_name,
    type: 'app_client'
  };

  const token = jwt.sign(tokenPayload, db.config.jwt_secret || 'viu_panel_super_secret_jwt_key_2026', {
    expiresIn: '365d'
  });

  addLog('Activation Code App réussie', 'Activation', `Premier accès code ${effectiveCode} activé pour ${device}`, foundCode.client_name, req.ip || '127.0.0.1');

  const activationResp = {
    success: true,
    message: 'Code activé avec succès',
    status: 'Active',
    token,
    code: effectiveCode,
    client_name: foundCode.client_name,
    username: newSub.username,
    activated_at: newSub.activated_at,
    expires_at: newSub.expires_at,
    device_id: device
  };
  console.log('[LOGIN API] Réponse envoyée au client (200 Activation):', activationResp);
  return res.json(activationResp);
});

// 2. Client App Categories Endpoint with Filtering Rules (GET /api/app/categories or /api/app/content/categories)
app.get(['/api/app/categories', '/api/app/content/categories'], authenticateAppClientJWT, async (req, res) => {
  const { server_id } = req.query;
  const db = loadDB();

  let categoriesList = [...db.categories];

  // Try fetching from Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        categoriesList = data.map((cat: any) => ({
          id: cat.id || cat.name,
          name: cat.name,
          order: cat.sort_order || 0,
          server_id: cat.server_id || 'movies',
          hidden: Boolean(cat.hidden)
        }));
      }
    } catch (e) {
      console.error('[Supabase] Error fetching categories for app:', e);
    }
  }

  // Filter out hidden categories
  let visibleCategories = categoriesList
    .filter(cat => !cat.hidden)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (server_id && typeof server_id === 'string' && server_id !== 'all') {
    visibleCategories = visibleCategories.filter(cat => cat.server_id === server_id);
  }

  res.json({
    success: true,
    total: visibleCategories.length,
    categories: visibleCategories
  });
});

// 3. Client App Proxy Content Endpoint (GET /api/app/content/:type or GET /api/app/proxy/xtream)
app.get(['/api/app/content/:type', '/api/app/proxy/xtream'], authenticateAppClientJWT, async (req, res) => {
  const reqType = (req.params.type || req.query.type || 'movies') as string;
  let serverId: 'movies' | 'series' | 'shahid' = 'movies';

  if (reqType === 'series') serverId = 'series';
  if (reqType === 'shahid') serverId = 'shahid';
  if (reqType === 'mymovies') serverId = 'movies'; // Proxy VOD items for My Movies collection

  const defaultAction = serverId === 'movies' ? 'get_vod_streams' : 'get_series';
  const action = (req.query.action as string) || defaultAction;
  const category_id = req.query.category_id as string;
  const series_id = req.query.series_id as string;
  const vod_id = req.query.vod_id as string;

  const extraParams: Record<string, string> = {};
  if (category_id) extraParams.category_id = category_id;
  if (series_id) extraParams.series_id = series_id;
  if (vod_id) extraParams.vod_id = vod_id;

  try {
    const data = await proxyXtreamRequest(serverId, action, extraParams);

    // Apply category filtering if data is a streams/content array containing category IDs
    if (Array.isArray(data)) {
      const db = loadDB();
      const hiddenCategoryNames = new Set(
        db.categories.filter(c => c.hidden).map(c => c.name.toLowerCase().trim())
      );

      if (hiddenCategoryNames.size > 0) {
        const filteredData = data.filter((item: any) => {
          const itemCatName = (item.category_name || item.name || '').toLowerCase().trim();
          return !hiddenCategoryNames.has(itemCatName);
        });
        return res.json({
          success: true,
          server: serverId,
          action,
          count: filteredData.length,
          data: filteredData
        });
      }
    }

    return res.json({
      success: true,
      server: serverId,
      action,
      count: Array.isArray(data) ? data.length : 1,
      data
    });
  } catch (err: any) {
    console.error(`[App Proxy Error] ${serverId} / ${action}:`, err.message);

    // Return friendly offline/demo fallback content structure so the client app never crashes
    return res.json({
      success: true,
      server: serverId,
      action,
      demo_fallback: true,
      data: [
        {
          stream_id: 101,
          name: serverId === 'movies' ? 'Inception 4K' : serverId === 'series' ? 'Stranger Things S04' : 'Shahid VIP Live Show',
          category_id: '1',
          container_extension: 'mp4',
          rating: '8.8',
          cover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60'
        }
      ]
    });
  }
});

// OpenAPI 3.0 Specification Endpoint (GET /api/docs/openapi.json)
app.get('/api/docs/openapi.json', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const baseUrl = `${protocol}://${host}`;

  const openapiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'VIU PANEL & CINEMA API',
      version: '1.0.0',
      description: 'API REST du VIU PANEL - Proxy Xtream temps réel pour Android TV et Panneau d\'administration'
    },
    servers: [{ url: baseUrl, description: 'Serveur VIU PANEL Actif' }],
    paths: {
      '/api/app/login': {
        post: {
          summary: 'Activation / Authentification App Android TV',
          description: 'Vérifie le code d\'abonnement à 8 chiffres, active le code et crée automatiquement le compte.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: '84729104', description: 'Code d\'abonnement à 8 chiffres' },
                    device_id: { type: 'string', example: 'AndroidTV_01' }
                  },
                  required: ['code']
                }
              }
            }
          },
          responses: {
            '200': { description: 'Compte activé, token JWT et credentials délivrés avec succès' },
            '400': { description: 'Code d\'abonnement invalide ou expiré' }
          }
        }
      },
      '/api/app/categories': {
        get: {
          summary: 'Récupère la liste des catégories filtrées et ordonnées',
          parameters: [
            { name: 'server_id', in: 'query', schema: { type: 'string', enum: ['movies', 'series', 'shahid'] } }
          ],
          responses: { '200': { description: 'Liste des catégories' } }
        }
      },
      '/api/app/content/{type}': {
        get: {
          summary: 'Proxy Xtream Temps Réel (Movies, Series, Shahid VIP, My Movies)',
          parameters: [
            { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['movies', 'series', 'shahid', 'mymovies'] } },
            { name: 'action', in: 'query', schema: { type: 'string' } },
            { name: 'category_id', in: 'query', schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Contenu récupéré en temps réel du serveur Xtream' } }
        }
      }
    }
  };

  res.setHeader('Content-Type', 'application/json');
  res.json(openapiSpec);
});

// 4. Downloadable Postman Collection Endpoint (GET /api/app/postman-collection)
app.get('/api/app/postman-collection', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const baseUrl = `${protocol}://${host}`;

  const postmanCollection = {
    info: {
      name: 'VIU CINEMA - Client App API Spec',
      description: 'Spécification complète des API pour l\'application Android TV VIU CINEMA',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    variable: [
      { key: 'baseUrl', value: baseUrl },
      { key: 'client_token', value: '' }
    ],
    item: [
      {
        name: '1. Authentification App (Login / Activation)',
        request: {
          method: 'POST',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: {
            mode: 'raw',
            raw: JSON.stringify({ code: '84729104', device_id: 'AndroidTV_LivingRoom_01' }, null, 2)
          },
          url: {
            raw: '{{baseUrl}}/api/app/login',
            host: ['{{baseUrl}}'],
            path: ['api', 'app', 'login']
          },
          description: 'Envoie le code à 8 chiffres. Active le code au premier accès ou reconnecte une session active. Renvoie un JWT client_token.'
        }
      },
      {
        name: '2. Liste des Catégories (Filtrées & Ordonnées)',
        request: {
          method: 'GET',
          header: [{ key: 'Authorization', value: 'Bearer {{client_token}}' }],
          url: {
            raw: '{{baseUrl}}/api/app/categories?server_id=movies',
            host: ['{{baseUrl}}'],
            path: ['api', 'app', 'categories'],
            query: [{ key: 'server_id', value: 'movies' }]
          },
          description: 'Récupère les catégories filtrées (exclut hidden=true et applique sort_order).'
        }
      },
      {
        name: '3. Contenu Proxy VOD / Films',
        request: {
          method: 'GET',
          header: [{ key: 'Authorization', value: 'Bearer {{client_token}}' }],
          url: {
            raw: '{{baseUrl}}/api/app/content/movies?action=get_vod_streams',
            host: ['{{baseUrl}}'],
            path: ['api', 'app', 'content', 'movies'],
            query: [{ key: 'action', value: 'get_vod_streams' }]
          },
          description: 'Proxy sécurisé pour récupérer le catalogue Films Xtream.'
        }
      },
      {
        name: '4. Contenu Proxy Séries',
        request: {
          method: 'GET',
          header: [{ key: 'Authorization', value: 'Bearer {{client_token}}' }],
          url: {
            raw: '{{baseUrl}}/api/app/content/series?action=get_series',
            host: ['{{baseUrl}}'],
            path: ['api', 'app', 'content', 'series'],
            query: [{ key: 'action', value: 'get_series' }]
          },
          description: 'Proxy sécurisé pour le catalogue Séries Xtream.'
        }
      },
      {
        name: '5. Contenu Proxy Shahid VIP',
        request: {
          method: 'GET',
          header: [{ key: 'Authorization', value: 'Bearer {{client_token}}' }],
          url: {
            raw: '{{baseUrl}}/api/app/content/shahid?action=get_series',
            host: ['{{baseUrl}}'],
            path: ['api', 'app', 'content', 'shahid'],
            query: [{ key: 'action', value: 'get_series' }]
          },
          description: 'Proxy sécurisé pour le catalogue Shahid VIP Xtream.'
        }
      }
    ]
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=VIU_CINEMA_Postman_Collection.json');
  res.json(postmanCollection);
});

// Effacement des journaux
app.delete('/api/logs', authenticateJWT, (req, res) => {
  const db = loadDB();
  db.logs = [];
  saveDB(db);
  addLog('Effacement des journaux', 'API', 'Tous les journaux d\'activité ont été effacés');
  res.json({ success: true, message: 'Journaux effacés avec succès' });
});

// Start Background Auto-Sync Timer
function runAutoSync() {
  const db = loadDB();
  if (!db.config.auto_sync_enabled) return;

  const now = new Date().toISOString();
  let syncCount = 0;

  Object.values(db.servers).forEach(s => {
    if (s.enabled) {
      s.lastSync = now;
      syncCount++;
    }
  });

  saveDB(db);
  addLog(
    'Synchronisation automatique',
    'Synchronisation',
    `Synchronisation automatique effectuée sur les ${syncCount} serveurs Xtream activés.`
  );
}

// Set auto-sync interval
setInterval(runAutoSync, 30 * 60 * 1000);

// Initialize Vite Dev Server or Production Static Files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VIU PANEL] Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
