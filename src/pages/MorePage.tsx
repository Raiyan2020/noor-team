
import React from 'react';
import { LogOut, User, Settings, HelpCircle, ChevronLeft, Languages, ChevronRight } from 'lucide-react';
import { translations, Locale } from '../services/i18n';

interface MorePageProps {
  onLogout: () => void;
  lang: Locale;
  toggleLang: () => void;
}

const MorePage: React.FC<MorePageProps> = ({ onLogout, lang, toggleLang }) => {
  const t = translations[lang];

  return (
    <div className="min-h-full bg-app-bg pt-10 px-6">
      <h1 className="text-2xl font-semibold text-app-text mb-8">{t.profile}</h1>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-app-gold/10 rounded-full flex items-center justify-center text-app-gold">
          <User size={32} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-app-text">{t.staff}</h2>
          <p className="text-sm text-gray-400">Hair Stylist</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-app-gold group-hover:bg-app-gold/5 transition-colors">
              <Languages size={20} />
            </div>
            <span className="font-semibold text-app-text text-sm">
              {lang === 'ar' ? 'English' : 'العربية'}
            </span>
          </div>
          {
            lang === 'ar' ? (
              <ChevronLeft size={18} className="text-gray-300" />
            ) : (
              <ChevronRight size={18} className="text-gray-300" />
            )
          }
        </button>

        {[
          { icon: Settings, label: t.settings },
          { icon: HelpCircle, label: t.helpSupport },
        ].map((item, idx) => (
          <button key={idx} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-98 transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-app-gold group-hover:bg-app-gold/5 transition-colors">
                <item.icon size={20} />
              </div>
              <span className="font-semibold text-app-text text-sm">{item.label}</span>
            </div>
            <ChevronLeft size={18} className="text-gray-300" />
          </button>
        ))}

        <button
          onClick={onLogout}
          className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-98 transition-transform mt-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
              <LogOut size={20} />
            </div>
            <span className="font-semibold text-red-500 text-sm">{t.logout}</span>
          </div>
        </button>
      </div>

      <div className="mt-12 text-center">
        <p className="text-xs text-gray-300 font-mono">App Version 1.0.0 (Team)</p>
      </div>
    </div>
  );
};

export default MorePage;
