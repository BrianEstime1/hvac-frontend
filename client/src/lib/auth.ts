const TOKEN_KEY = "ferdair_token";
const EXPIRY_KEY = "ferdair_token_expiry";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getExpiry(): number | null {
  if (!isBrowser()) return null;
  const stored = localStorage.getItem(EXPIRY_KEY);
  const expiry = stored ? Number(stored) : NaN;
  return Number.isFinite(expiry) ? expiry : null;
}

export function clearToken() {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

export function setToken(token: string, expiresInSeconds?: number) {
  if (!isBrowser()) return;
  const ttl = expiresInSeconds
    ? expiresInSeconds * 1000
    : DEFAULT_TTL_MS;
  const expiry = Date.now() + ttl;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRY_KEY, expiry.toString());
}

export function getToken(): string | null {
  if (!isBrowser()) return null;

  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = getExpiry();

  if (!token || !expiry) {
    return null;
  }

  if (Date.now() > expiry) {
    clearToken();
    return null;
  }

  return token;
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
