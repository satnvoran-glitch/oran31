export type NavigationItem =
  | 'dashboard'
  | 'movies'
  | 'series'
  | 'shahid'
  | 'categories'
  | 'codes'
  | 'subscriptions'
  | 'config'
  | 'logs';

export interface XtreamServerConfig {
  id: 'movies' | 'series' | 'shahid';
  name: string;
  host: string;
  username: string;
  password: string;
  status: 'Connected' | 'Disconnected' | 'Error' | 'Testing';
  lastSync: string | null;
  enabled: boolean;
  itemCount?: number;
  categoryCount?: number;
}

export interface SubscriptionCode {
  id: string;
  code: string; // Exactly 8 digits
  client_name: string;
  duration: number; // Duration in months
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  status: 'Disponible' | 'Utilisé' | 'Expiré';
}

export interface Subscription {
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
}

export interface MyMovie {
  id: string;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  video_url: string;
  trailer_url: string;
  category_id: string;
  category_name: string;
  added_at: string;
  status: 'Active' | 'Draft' | 'Hidden';
}

export interface Category {
  id: string;
  name: string;
  order: number;
  server_id: 'movies' | 'series' | 'shahid';
  hidden: boolean;
  item_count?: number;
}

export interface SystemConfig {
  panel_name: string;
  logo_url: string;
  timezone: string;
  supabase_url: string;
  supabase_anon_key: string;
  jwt_secret: string;
  default_duration: number; // in months
  sync_interval: number; // in minutes
  auto_sync_enabled: boolean;
}

export interface ActivityLog {
  id: string;
  date: string;
  ip: string;
  user: string;
  action: string;
  type: 'Activation' | 'Connexion' | 'Erreur' | 'API' | 'Synchronisation';
  details: string;
}

export interface DashboardStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  availableCodes: number;
  usedCodes: number;
  configuredServers: number;
  serverStatuses: Record<string, 'Connected' | 'Disconnected' | 'Error' | 'Testing'>;
  lastSyncTime: string | null;
  recentActivations: Subscription[];
  recentErrors: ActivityLog[];
}

export interface XtreamVodCategory {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export interface XtreamVodStream {
  num?: number;
  name: string;
  stream_type?: string;
  stream_id: number | string;
  stream_icon?: string;
  rating?: string;
  rating_5based?: number;
  added?: string;
  category_id: string;
  container_extension?: string;
  direct_source?: string;
}

export interface XtreamVodInfo {
  info: {
    movie_image?: string;
    description?: string;
    plot?: string;
    genre?: string;
    releaseDate?: string;
    director?: string;
    cast?: string;
    duration?: string;
    rating?: string;
    youtube_trailer?: string;
  };
  movie_data: {
    stream_id: number | string;
    name: string;
    container_extension?: string;
  };
}

export interface XtreamSeriesCategory {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export interface XtreamSeriesItem {
  num?: number;
  name: string;
  series_id: number | string;
  cover?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  last_modified?: string;
  rating?: string;
  rating_5based?: number;
  category_id: string;
}

export interface XtreamEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info?: {
    duration?: string;
    plot?: string;
    movie_image?: string;
  };
}

export interface XtreamSeriesInfo {
  seasons: Array<{
    air_date?: string;
    episode_count?: number;
    id?: number;
    name?: string;
    overview?: string;
    poster_path?: string;
    season_number: number;
  }>;
  episodes: Record<string, XtreamEpisode[]>;
  info: {
    name: string;
    cover?: string;
    plot?: string;
    cast?: string;
    director?: string;
    genre?: string;
    releaseDate?: string;
    rating?: string;
  };
}

export interface ActivateCodePayload {
  code: string;
  client_name: string;
}

export interface ActivateCodeResponse {
  success: boolean;
  username?: string;
  password?: string;
  expiration_date?: string;
  status?: string;
  error?: string;
}
