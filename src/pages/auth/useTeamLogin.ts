import { useState } from "react";
import { toast } from "sonner";
import { teamLogin, LoginCredentials } from "./auth.api";
import { Locale } from "../../services/i18n";

const messages = {
    ar: { success: "تم تسجيل الدخول بنجاح", error: "حدث خطأ، يرجى المحاولة مجدداً" },
    en: { success: "Logged in successfully", error: "An error occurred, please try again" },
};

export function useTeamLogin(lang: Locale) {
    const [isLoading, setIsLoading] = useState(false);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const result = await teamLogin(credentials, lang);
            if (result.ok) {
                toast.success(messages[lang]?.success ?? messages.en.success);
            } else {
                toast.error(result.error || (messages[lang]?.error ?? messages.en.error));
            }
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    return { login, isLoading };
}

