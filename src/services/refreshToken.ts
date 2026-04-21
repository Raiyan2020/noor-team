import { http } from "./http";
import { getRefreshToken, getUser, clearAuth, setAuth } from "./authStorage";

export async function refreshToken(lang: string) {
    const refresh_token = getRefreshToken();
    if (!refresh_token) return { ok: false as const, error: "No refresh token" };

    const formData = new FormData();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refresh_token);
    formData.append("client_id", "a0f9c982-62a4-491f-9368-386ee80dc9ec");
    formData.append("client_secret", "4dPG6KXX3GAZVuw2NNEyJbCYsgh7T1uu3Pk7xand");

    try {
        const res = await http.post("/auth/refresh-token", formData, {
            headers: { lang, "x-skip-auth": "1" },
        });

        if (!res?.data?.status || !res?.data?.items) {
            return { ok: false as const, error: res?.data?.message || "Refresh failed" };
        }

        const items = res.data.items;
        if (!items.access_token || !items.refresh_token) {
            return { ok: false as const, error: "Invalid refresh response" };
        }

        const existingUser = getUser() || undefined;

        setAuth(
            {
                access_token: items.access_token,
                refresh_token: items.refresh_token,
                token_type: items.token_type,
                expires_in: items.expires_in,
            },
            existingUser
        );

        return { ok: true as const };
    } catch (e: any) {
        clearAuth();
        return {
            ok: false as const,
            error: e?.response?.data?.message || e?.message || "Refresh error",
        };
    }
}
