import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { DASHBOARD_API_BASE_URL } from "../lib/apiConfig";
import { refreshToken } from "./refreshToken";
import { getAccessToken, getRefreshToken, clearAuth } from "./authStorage";

export class UnauthorizedError extends Error {
    isUnauthorized = true;
    reason?: string;
    constructor(reason?: string) {
        super("unauthorized");
        this.name = "UnauthorizedError";
        this.reason = reason;
    }
}

export const authEvents = { onLogout: (reason?: string) => { } };

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

function isSessionExpiredResponse(data: any) {
    return data?.status === false && data?.statusCode === 401;
}

function isAuthEndpoint(url?: string) {
    if (!url) return false;
    return url.includes("/login") || url.includes("/refresh-token");
}

export const http: AxiosInstance = axios.create({ baseURL: DASHBOARD_API_BASE_URL });

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const skipAuth = (config.headers as any)?.["x-skip-auth"];
    config.headers = config.headers ?? {};

    if (!skipAuth) {
        const token = getAccessToken?.();
        if (token) (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

async function handleUnauthorized(originalConfig: any) {
    if (isAuthEndpoint(originalConfig?.url)) throw new UnauthorizedError("auth_endpoint");

    if (originalConfig?._retry) {
        clearAuth();
        authEvents.onLogout?.("session_expired");
        throw new UnauthorizedError("already_retried");
    }
    originalConfig._retry = true;

    const hasRefresh = !!getRefreshToken?.();
    if (!hasRefresh) {
        clearAuth();
        authEvents.onLogout?.("no_refresh_token");
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
        clearAuth();
        authEvents.onLogout?.("refresh_failed");
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
            return handleUnauthorized(response.config);
        }

        return response;
    },
    async (error: AxiosError) => {
        const originalConfig: any = error.config;
        if (isAuthEndpoint(originalConfig?.url)) return Promise.reject(error);

        const status = error.response?.status;
        const data: any = error.response?.data;

        if (status === 401 || isSessionExpiredResponse(data)) {
            try {
                return await handleUnauthorized(originalConfig);
            } catch (e) {
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);
