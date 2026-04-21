import { useState } from "react";
import { teamLogin, LoginCredentials } from "./auth.api";
import { Locale } from "../../services/i18n";

export function useTeamLogin(lang: Locale) {
    const [isLoading, setIsLoading] = useState(false);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const result = await teamLogin(credentials, lang);
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    return { login, isLoading };
}
