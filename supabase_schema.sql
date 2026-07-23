-- VIU PANEL - Supabase PostgreSQL Schema Script
-- Paste and run this script in your Supabase SQL Editor

-- 1. Create System Config Table (Paramètres)
CREATE TABLE IF NOT EXISTS public.config (
  id TEXT PRIMARY KEY DEFAULT 'system',
  panel_name TEXT DEFAULT 'VIU PANEL',
  logo_url TEXT DEFAULT '',
  timezone TEXT DEFAULT 'Europe/Paris',
  supabase_url TEXT DEFAULT '',
  supabase_anon_key TEXT DEFAULT '',
  jwt_secret TEXT DEFAULT 'viu_panel_super_secret_jwt_key_2026',
  default_duration INT DEFAULT 12,
  sync_interval INT DEFAULT 30,
  auto_sync_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Xtream Server Credentials Table (Paramètres des serveurs Xtream)
CREATE TABLE IF NOT EXISTS public.xtream_servers (
  id TEXT PRIMARY KEY, -- 'movies', 'series', 'shahid'
  name TEXT NOT NULL,
  host TEXT DEFAULT '',
  username TEXT DEFAULT '',
  password TEXT DEFAULT '',
  status TEXT DEFAULT 'Disconnected',
  last_sync TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Subscription Codes Table (Codes d'abonnement)
CREATE TABLE IF NOT EXISTS public.codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- 8-digit activation code
  client_name TEXT DEFAULT '',
  duration INT NOT NULL DEFAULT 12, -- months
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Disponible' -- 'Disponible', 'Utilisé', 'Expiré'
);

-- 4. Create Subscriptions Table (Abonnements & Utilisateurs)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  code_used TEXT REFERENCES public.codes(code) ON DELETE SET NULL,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'Active', -- 'Active', 'Suspended', 'Expired'
  device_id TEXT DEFAULT 'Android TV',
  last_connection TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Categories Table (Catégories de l'application UI)
-- Note: Contient UNIQUEMENT l'organisation des catégories UI. Jamais de vidéos.
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  server_id TEXT DEFAULT 'movies', -- 'movies', 'series', 'shahid'
  hidden BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Activity Logs Table (Logs)
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip TEXT DEFAULT '127.0.0.1',
  user_agent TEXT DEFAULT 'VIU System',
  action TEXT NOT NULL,
  type TEXT DEFAULT 'API', -- 'Activation', 'Connexion', 'Erreur', 'API', 'Synchronisation'
  details TEXT DEFAULT ''
);

-- 7. Permissions & Grants for Supabase Client Access
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Insert Initial Seed Config & Server Defaults
INSERT INTO public.config (id, panel_name) 
VALUES ('system', 'VIU PANEL') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.xtream_servers (id, name, host, username, password, status) VALUES
('movies', 'Movies Server', 'http://xtream-server1.me:8080', 'user_movies', 'pass_movies', 'Disconnected'),
('series', 'Series Server', 'http://xtream-server2.me:8080', 'user_series', 'pass_series', 'Disconnected'),
('shahid', 'Shahid VIP Server', 'http://xtream-server3.me:8080', 'user_shahid', 'pass_shahid', 'Disconnected')
ON CONFLICT (id) DO NOTHING;

-- Insert Seed App Categories
INSERT INTO public.categories (name, server_id, sort_order, hidden) VALUES
('Action', 'movies', 1, false),
('Nouveautés', 'movies', 2, false),
('Animation', 'movies', 3, false),
('Séries VF Netflix', 'series', 4, false),
('Marvel', 'movies', 5, false),
('Disney', 'movies', 6, false),
('Films Français', 'movies', 7, false),
('Shahid VIP Exclusivités', 'shahid', 8, false)
ON CONFLICT (name) DO NOTHING;
