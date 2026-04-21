import { toast } from "sonner";
import { http } from "../../services/http";
import { DASHBOARD_API_BASE_URL } from "../../lib/apiConfig";
import { Locale } from "../../services/i18n";
import { setAuth } from "../../services/authStorage";

export type LoginCredentials = {
    username: string;
    password: string;
};

export type LoginResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items?: {
        token: {
            token_type: string;
            expires_in: number;
            access_token: string;
            refresh_token: string;
        };
        admin: any;
        permissions: string[];
        roles: string[];
    };
};

export function toastApi(status: boolean, message: string) {
    toast(message || (status ? "Success" : "Something went wrong"), {
        style: {
            background: status ? "#198754" : "#dc3545",
            color: "#fff",
            borderRadius: "10px",
        },
    });
}

export async function teamLogin(
    credentials: LoginCredentials,
    lang: Locale
) {
    try {
        const formData = new FormData();
        formData.append("grant_type", "password");
        formData.append("client_secret", "4dPG6KXX3GAZVuw2NNEyJbCYsgh7T1uu3Pk7xand");
        formData.append("client_id", "a0f9c982-62a4-491f-9368-386ee80dc9ec");
        formData.append("username", credentials.username);
        formData.append("password", credentials.password);

        const res = await http.post<LoginResponse>(
            `${DASHBOARD_API_BASE_URL}/auth/login`,
            formData,
            {
                headers: {
                    "Accept-Language": lang,
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data",
                    "x-skip-auth": "1",
                },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status || !res?.data?.items?.token) {
            return { ok: false as const, error: res?.data?.message || "Login failed" };
        }

        const { token, admin, permissions } = res.data.items;

        if (!token.access_token || !token.refresh_token) {
            return { ok: false as const, error: "Invalid login response" };
        }

        setAuth(
            {
                access_token: token.access_token,
                refresh_token: token.refresh_token,
                token_type: token.token_type,
                expires_in: token.expires_in,
            },
            {
                ...admin,
                permissions,
                roles: res.data.items.roles
            }
        );

        return { ok: true as const, user: admin, permissions };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Login error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
