export type TokenPair = {
    access_token: string;
    refresh_token: string;
    token_type?: string;
    expires_in?: number;
};

export type User = {
    id: number | string;
    name?: string;
    phone?: string;
    email?: string | null;
    photo?: string | null;
    lang?: string;
    [k: string]: any;
};

const TOKEN_KEY = "salon_team_token";
const REFRESH_KEY = "salon_team_refresh_token";
const USER_KEY = "salon_team_user";
const USER_ID_KEY = "salon_team_userId";
const EXPIRES_AT_KEY = "salon_team_token_expires_at";
const SESSION_KEY = "salon_team_session";

export function setAuth(token: TokenPair, user?: User) {
    localStorage.setItem(TOKEN_KEY, token.access_token);
    localStorage.setItem(REFRESH_KEY, token.refresh_token);

    if (token.expires_in) {
        const expiresAt = Date.now() + token.expires_in * 1000;
        localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    } else {
        localStorage.removeItem(EXPIRES_AT_KEY);
    }

    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        if (user.id !== undefined) localStorage.setItem(USER_ID_KEY, String(user.id));
        
        // Match the session format used in the original project for consistency
        const session = {
            id: user.id?.toString() || user.id,
            username: user.username || user.name,
            email: user.email,
            fullName: user.name,
            role: (user.roles?.[0]?.name || "staff"),
            status: user.status,
            permissions: user.permissions || [],
            roles: user.roles?.map((r: any) => r.name) || [],
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            lastLoginAt: new Date().toISOString(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token.access_token)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(SESSION_KEY);

    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function getAccessToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY) || "";
}

export function getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

export function isLoggedIn() {
    return Boolean(getAccessToken());
}
