export interface ParsedXtreamUrl {
  host: string;
  username: string;
  password: string;
  isValid: boolean;
  error?: string;
}

export function parseXtreamUrl(rawUrl: string): ParsedXtreamUrl {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      host: '',
      username: '',
      password: '',
      isValid: false,
      error: 'L\'URL ne peut pas être vide'
    };
  }

  let urlString = trimmed;
  if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
    urlString = 'http://' + urlString;
  }

  try {
    const parsed = new URL(urlString);
    const host = parsed.origin;
    const username = parsed.searchParams.get('username') || '';
    const password = parsed.searchParams.get('password') || '';

    if (!username || !password) {
      return {
        host,
        username,
        password,
        isValid: false,
        error: 'L\'URL doit contenir les paramètres username et password'
      };
    }

    return {
      host,
      username,
      password,
      isValid: true
    };
  } catch (err) {
    return {
      host: '',
      username: '',
      password: '',
      isValid: false,
      error: 'Format d\'URL invalide'
    };
  }
}

export function buildFullXtreamUrl(host?: string, username?: string, password?: string, defaultAction: string = 'get_vod_streams'): string {
  if (!host || !username || !password) return '';
  const cleanHost = host.replace(/\/+$/, '');
  return `${cleanHost}/player_api.php?username=${username}&password=${password}&action=${defaultAction}`;
}
