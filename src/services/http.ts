import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { DASHBOARD_API_BASE_URL } from "../lib/apiConfig";
import { refreshToken } from "./refreshToken";
import { getAccessToken, getRefreshToken, clearAuth } from "./authStorage";
import { getLang } from "./i18n";

export class UnauthorizedError extends Error {
    isUnauthorized = true;
    reason?: string;
    constructor(reason?: string) {
        super("unauthorized");
        this.name = "UnauthorizedError";
        this.reason = reason;
    }
}

export const authEvents = { onLogout: (reason?: string, message?: string) => { } };

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
// Prevents multiple concurrent 401 failures from each firing a toast/logout
let hasLoggedOut = false;

function isSessionExpiredResponse(data: any) {
    return data?.status === false && data?.statusCode === 401;
}

function isAuthEndpoint(url?: string) {
    if (!url) return false;
    return url.includes("/login") || url.includes("/refresh-token") || url.includes("/auth/logout");
}

export const http: AxiosInstance = axios.create({ baseURL: DASHBOARD_API_BASE_URL });

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const skipAuth = (config.headers as any)?.["x-skip-auth"];
    config.headers = config.headers ?? {};

    // A successful authenticated request marks the start of a new session.
    // Do not reset this latch for logout/auth requests, otherwise a logout can
    // immediately re-enable duplicate session-expiry handling.
    if (!skipAuth && !isAuthEndpoint(config.url)) hasLoggedOut = false;

    // Add Language headers
    const lang = getLang();
    if (lang) {
        (config.headers as any)["Accept-Language"] = lang;
        (config.headers as any)["lang"] = lang;
    }

    if (!skipAuth) {
        const token = getAccessToken?.();
        if (token) (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

function triggerLogout(reason: string, apiMessage?: string) {
    if (hasLoggedOut) return; // already handled — skip duplicate toasts
    hasLoggedOut = true;
    clearAuth();
    authEvents.onLogout?.(reason, apiMessage);
}

async function handleUnauthorized(originalConfig: any, apiMessage?: string) {
    if (isAuthEndpoint(originalConfig?.url)) throw new UnauthorizedError("auth_endpoint");

    if (originalConfig?._retry) {
        triggerLogout("session_expired", apiMessage);
        throw new UnauthorizedError("already_retried");
    }
    originalConfig._retry = true;

    const hasRefresh = !!getRefreshToken?.();
    if (!hasRefresh) {
        triggerLogout("no_refresh_token", apiMessage);
        throw new UnauthorizedError("no_refresh_token");
    }

    if (!isRefreshing) {
        isRefreshing = true;
        const lang = (originalConfig.headers?.lang as string) || "ar";
        refreshPromise = refreshToken(lang).then((r) => {
            isRefreshing = false;
            return r.ok;
        });
    }

    const ok = await refreshPromise!;
    if (!ok) {
        triggerLogout("refresh_failed", apiMessage);
        throw new UnauthorizedError("refresh_failed");
    }

    const newToken = getAccessToken?.();
    if (newToken) originalConfig.headers.Authorization = `Bearer ${newToken}`;

    return http.request(originalConfig);
}

http.interceptors.response.use(
    async (response) => {
        if (isAuthEndpoint(response.config?.url)) return response;

        if (isSessionExpiredResponse(response.data)) {
            const apiMessage: string | undefined = response.data?.message;
            return handleUnauthorized(response.config, apiMessage);
        }

        return response;
    },
    async (error: AxiosError) => {
        const originalConfig: any = error.config;
        if (isAuthEndpoint(originalConfig?.url)) return Promise.reject(error);

        const status = error.response?.status;
        const data: any = error.response?.data;
        const apiMessage: string | undefined = (data as any)?.message;

        if (status === 401 || isSessionExpiredResponse(data)) {
            try {
                return await handleUnauthorized(originalConfig, apiMessage);
            } catch (e) {
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);
