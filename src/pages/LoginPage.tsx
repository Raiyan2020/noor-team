
import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { useTeamLogin } from './auth/useTeamLogin';
import { translations, getLang, Locale } from '../services/i18n';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const lang: Locale = getLang();
  const t = translations[lang];
  const { login, isLoading } = useTeamLogin(lang);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password');
      return;
    }

    const result = await login({ username, password });

    if (result.ok) {
      onLogin();
    } else {
      setError(result.error || (lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
    }
  };

  return (
    <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col items-center justify-center p-8 mx-auto font-alexandria" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-20 h-20 bg-app-gold rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-app-gold/20">
        <Lock className="text-white" size={32} />
      </div>

      <h1 className="text-2xl font-semibold text-app-text mb-2">{lang === 'ar' ? 'تسجيل دخول الموظفين' : 'Staff Login'}</h1>
      <p className="text-sm text-gray-400 mb-8">{t.signInMessage}</p>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t.username}
            className={`w-full p-4 ${lang === 'ar' ? 'pr-12' : 'pl-12'} bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-app-gold focus:bg-white transition-all`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <User className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
        </div>

        <div className="relative">
          <input
            type="password"
            placeholder={t.password}
            className={`w-full p-4 ${lang === 'ar' ? 'pr-12' : 'pl-12'} bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-app-gold focus:bg-white transition-all`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Lock className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
        </div>

        {error && (
          <div className="text-red-500 text-xs font-semibold text-center bg-red-50 py-2 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/20 active:scale-[0.98] transition-transform mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (lang === 'ar' ? 'جاري الدخول...' : 'Logging in...') : (lang === 'ar' ? 'دخول' : 'Login')}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">{lang === 'ar' ? 'نظام إدارة صالون ميزون دي نور' : 'Maison De Noor Salon Management System'}</p>
      </div>
    </div>
  );
};

export default LoginPage;

