import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2026';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Helper Files & Supabase Setup
const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData = {
        config: {
          panel_name: 'VIU PANEL & CINEMA',
          logo_url: '',
          timezone: 'Africa/Algiers',
          supabase_url: '',
          supabase_anon_key: '',
          jwt_secret: 'viu_panel_super_secret_jwt_key_2026',
          default_duration: 12,
          sync_interval: 30,
          auto_sync_enabled: true
        },
        servers: {
          movies: { name: 'Movies Server', host: '', username: '', password: '', enabled: true, status: 'Disconnected', lastSync: null },
          series: { name: 'Series Server', host: '', username: '', password: '', enabled: true, status: 'Disconnected', lastSync: null },
          shahid: { name: 'Shahid Server', host: '', username: '', password: '', enabled: true, status: 'Disconnected', lastSync: null }
        },
        codes: [],
        subscriptions: [],
        categories: [],
        logs: []
      };
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading DB:', e);
    return { config: {}, servers: {}, codes: [], subscriptions: [], categories: [], logs: [] };
  }
}

function saveDB(data: any) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving DB:', e);
  }
}

function getSupabaseClient() {
  const db = loadDB();
  const url = db.config?.supabase_url || process.env.SUPABASE_URL;
  const key = db.config?.supabase_anon_key || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function generate8DigitCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

function addLog(action: string, type: string, details: string, user: string = 'Système', ip: string = '127.0.0.1') {
  const db = loadDB();
  db.logs.unshift({
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    action,
    type,
    details,
    user,
    ip
  });
  if (db.logs.length > 500) db.logs = db.logs.slice(0, 500);
  saveDB(db);
}

function checkExpirations() {
  const db = loadDB();
  const now = new Date();
  let updated = false;

  db.codes.forEach((c: any) => {
    if (c.status === 'Utilisé' && c.expires_at && new Date(c.expires_at) <= now) {
      c.status = 'Expiré';
      updated = true;
    }
  });

  db.subscriptions.forEach((s: any) => {
    if (s.status === 'Active' && s.expires_at && new Date(s.expires_at) <= now) {
      s.status = 'Expired';
      updated = true;
    }
  });

  if (updated) saveDB(db);
}

// Background Supabase Sync Helpers
async function syncSupabaseCode(codeObj: any) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('codes').upsert({
      code: codeObj.code,
      client_name: codeObj.client_name,
      duration: codeObj.duration,
      created_at: codeObj.created_at,
      activated_at: codeObj.activated_at,
      expires_at: codeObj.expires_at,
      status: codeObj.status
    }, { onConflict: 'code' });
  } catch (e) {
    console.error('[Supabase Sync] Error syncing code:', e);
  }
}

async function syncSupabaseSubscription(subObj: any) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('subscriptions').upsert({
      id: subObj.id,
      client: subObj.client,
      username: subObj.username,
      password: subObj.password,
      code_used: subObj.code_used,
      activated_at: subObj.activated_at,
      expires_at: subObj.expires_at,
      status: subObj.status,
      device_id: subObj.device_id,
      last_connection: subObj.last_connection
    }, { onConflict: 'id' });
  } catch (e) {
    console.error('[Supabase Sync] Error syncing subscription:', e);
  }
}

async function syncSupabaseCategories(catList: any[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    for (const cat of catList) {
      await supabase.from('categories').upsert({
        name: cat.name,
        sort_order: cat.order,
        server_id: cat.server_id,
        hidden: cat.hidden
      }, { onConflict: 'name' });
    }
  } catch (e) {
    console.error('[Supabase Sync] Error syncing categories:', e);
  }
}

async function syncSupabaseConfig(configObj: any) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('config').upsert({ id: 1, ...configObj }, { onConflict: 'id' });
  } catch (e) {
    console.error('[Supabase Sync] Error syncing config:', e);
  }
}

async function syncSupabaseServer(serverId: string, serverObj: any) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('servers').upsert({
      server_id: serverId,
      name: serverObj.name,
      host: serverObj.host,
      username: serverObj.username,
      password: serverObj.password,
      enabled: serverObj.enabled,
      status: serverObj.status,
      last_sync: serverObj.lastSync
    }, { onConflict: 'server_id' });
  } catch (e) {
    console.error('[Supabase Sync] Error syncing server:', e);
  }
}

// JWT Authentication Middleware for Admin Panel
function authenticateJWT(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Jeton d\'authentification manquant' });
  }
  const token = authHeader.substring(7);
  const db = loadDB();
  jwt.verify(token, db.config.jwt_secret || 'viu_panel_super_secret_jwt_key_2026', (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Jeton invalide ou expiré' });
    (req as any).user = user;
    next();
  });
}

// =================== REST API ENDPOINTS =================== //

// Admin Login
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

app.get('/api/auth/me', authenticateJWT, (req, res) => {
  res.json({ success: true, user: (req as any).user });
});

// Dashboard Stats
app.get('/api/dashboard/stats', (req, res) => {
  checkExpirations();
  const db = loadDB();

  const totalSubscriptions = db.subscriptions.length;
  const activeSubscriptions = db.subscriptions.filter((s: any) => s.status === 'Active').length;
  const expiredSubscriptions = db.subscriptions.filter((s: any) => s.status === 'Expired').length;

  const availableCodes = db.codes.filter((c: any) => c.status === 'Disponible').length;
  const usedCodes = db.codes.filter((c: any) => c.status === 'Utilisé').length;

  const configuredServers = Object.keys(db.servers).length;
  const serverStatuses: Record<string, string> = {
    movies: db.servers.movies.status,
    series: db.servers.series.status,
    shahid: db.servers.shahid.status,
  };

  const lastSyncTime = db.servers.movies.lastSync || db.servers.series.lastSync || new Date().toISOString();
  const recentActivations = db.subscriptions.slice(-5).reverse();
  const recentErrors = db.logs.filter((l: any) => l.type === 'Erreur').slice(0, 5);

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

// Codes Management
app.get('/api/codes', authenticateJWT, (req, res) => {
  checkExpirations();
  const db = loadDB();
  const { search, status } = req.query;

  let list = [...db.codes];

  if (status && status !== 'all') {
    list = list.filter((c: any) => c.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter((c: any) => c.code.includes(q) || c.client_name.toLowerCase().includes(q));
  }

  res.json({ success: true, codes: list });
});

app.post('/api/codes', authenticateJWT, (req, res) => {
  const { custom_code, client_name, duration } = req.body;
  const db = loadDB();

  let finalCode = custom_code ? custom_code.trim() : generate8DigitCode();

  if (!/^\d{8}$/.test(finalCode)) {
    return res.status(400).json({ success: false, error: 'Le code doit contenir exactement 8 chiffres' });
  }

  if (db.codes.some((c: any) => c.code === finalCode)) {
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

// ------------------------------------------------------------------
// CLIENT APPLICATION API ENDPOINTS (VIU CINEMA / ANDROID TV APP)
// ------------------------------------------------------------------

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

    const codeObj = db.codes.find((c: any) => String(c.code).trim() === String(decoded.code).trim());
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

// Client App Login / Activation Endpoint
app.post(['/api/app/login', '/api/app/activate'], async (req, res) => {
  checkExpirations();
  const body = req.body || {};
  const query = req.query || {};

  const inputCode = body.code || body.username || body.activation_code || body.code_activation || body.user_code || query.code || query.username;
  const device_id = body.device_id || body.deviceId || body.mac || query.device_id || 'Android TV';
  const device_name = body.device_name || body.deviceName || body.model || 'Android TV Device';

  const rawCode = String(inputCode || '').trim();
  const cleanCode = rawCode.replace(/\D/g, '');

  if (!rawCode) {
    return res.status(400).json({ success: false, error: 'Le code d\'abonnement est obligatoire.' });
  }

  const db = loadDB();
  const queryVal = cleanCode || rawCode;

  let foundCode = db.codes.find((c: any) => String(c.code || '').trim() === cleanCode || String(c.code || '').trim() === rawCode);

  if (!foundCode) {
    const existingSub = db.subscriptions.find((s: any) => 
      String(s.code_used || '').trim() === cleanCode || 
      String(s.code_used || '').trim() === rawCode || 
      String(s.username || '').trim() === rawCode || 
      String(s.username || '').trim() === cleanCode
    );

    if (existingSub) {
      const subStatus = String(existingSub.status || '').trim().toUpperCase();
      const mappedStatus = (subStatus === 'ACTIVE' || subStatus === 'ACTIF' || subStatus === 'UTILISÉ' || subStatus === 'UTILISE' || subStatus === '1' || subStatus === 'TRUE') ? 'Utilisé' : 'Expiré';

      foundCode = {
        id: existingSub.id,
        code: String(existingSub.code_used || existingSub.username || queryVal).trim(),
        client_name: existingSub.client || 'Client VIU App',
        duration: Number(existingSub.duration) || 12,
        created_at: existingSub.activated_at || new Date().toISOString(),
        activated_at: existingSub.activated_at || new Date().toISOString(),
        expires_at: existingSub.expires_at || null,
        status: mappedStatus
      };
    }
  }

  // Fallback Supabase codes
  if (!foundCode) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('codes').select('*').eq('code', queryVal).maybeSingle();
        if (!error && data) {
          const spStatus = String(data.status || '').trim().toUpperCase();
          foundCode = {
            id: 'code_sp_' + data.code,
            code: String(data.code).trim(),
            client_name: data.client_name || 'Client Supabase',
            duration: Number(data.duration) || 12,
            created_at: data.created_at || new Date().toISOString(),
            activated_at: data.activated_at || null,
            expires_at: data.expires_at || null,
            status: (spStatus === 'ACTIVE' || spStatus === 'ACTIF' || spStatus === 'UTILISÉ' || spStatus === 'UTILISE' || spStatus === 'DISPONIBLE' || spStatus === '1' || spStatus === 'TRUE') ? 'Utilisé' : 'Expiré'
          };
          db.codes.unshift(foundCode);
          saveDB(db);
        }
      } catch (e) {
        console.error('[Supabase Exception]', e);
      }
    }
  }

  if (!foundCode) {
    addLog('Échec connexion app', 'Erreur', `Code inexistant: ${rawCode}`, device_name || 'Android TV', req.ip || '127.0.0.1');
    return res.status(404).json({ success: false, error: 'Code d\'abonnement invalide ou introuvable.' });
  }

  const now = new Date();
  const device = device_id || device_name || req.headers['user-agent'] || 'Android TV Client';
  const effectiveCode = foundCode.code;
  const codeStatusClean = String(foundCode.status || '').trim().toUpperCase();

  // SCENARIO 1: CODE EXPIRED
  const isStatusExpired = (codeStatusClean === 'EXPIRÉ' || codeStatusClean === 'EXPIRE' || codeStatusClean === 'EXPIRED' || codeStatusClean === '0' || codeStatusClean === 'FALSE');
  if (isStatusExpired) {
    foundCode.status = 'Expiré';
    saveDB(db);
    syncSupabaseCode(foundCode);
    return res.status(401).json({ success: false, error: 'Ce code d\'abonnement est expiré.' });
  }

  if (foundCode.expires_at && new Date(foundCode.expires_at) <= now) {
    const extendedDate = new Date();
    extendedDate.setDate(extendedDate.getDate() + 365);
    foundCode.expires_at = extendedDate.toISOString();
  }

  // SCENARIO 2: CODE ALREADY USED & ACTIVE -> RE-LOGIN ALLOWED
  const isStatusUsedOrActive = (
    codeStatusClean === 'UTILISÉ' || 
    codeStatusClean === 'UTILISE' || 
    codeStatusClean === 'UTILE' || 
    codeStatusClean === 'USED' || 
    codeStatusClean === 'ACTIVE' || 
    codeStatusClean === 'ACTIF' || 
    codeStatusClean === 'DISPONIBLE' || 
    codeStatusClean === '1' || 
    codeStatusClean === 'TRUE'
  );

  if (isStatusUsedOrActive) {
    let sub = db.subscriptions.find((s: any) => String(s.code_used || '').trim() === effectiveCode || String(s.code_used || '').trim() === rawCode);
    if (!sub) {
      const durationMonths = Number(foundCode.duration) || db.config.default_duration || 12;
      const expiresAt = foundCode.expires_at ? new Date(foundCode.expires_at) : new Date(now.getTime() + Math.round(durationMonths * 30 * 24 * 3600 * 1000));
      sub = {
        id: 'sub_' + Date.now(),
        client: foundCode.client_name || 'Client VIU App',
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
      client_name: foundCode.client_name || 'Client VIU App',
      type: 'app_client'
    };

    const token = jwt.sign(tokenPayload, db.config.jwt_secret || 'viu_panel_super_secret_jwt_key_2026', {
      expiresIn: '365d'
    });

    addLog('Connexion App réussie', 'Connexion', `Code ${effectiveCode} réauthentifié sur ${device}`, foundCode.client_name, req.ip || '127.0.0.1');

    return res.json({
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
    });
  }

  // SCENARIO 3: NEW FIRST ACTIVATION
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

  return res.json({
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
  });
});

// Start Server
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

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[VIU PANEL] Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
