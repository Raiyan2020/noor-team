import React from 'react';
import { Calendar, ScanLine, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { translations, Locale } from '../services/i18n';

interface TeamTabBarProps {
  lang?: Locale;
}

const TeamTabBar: React.FC<TeamTabBarProps> = ({ lang = 'ar' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[lang];

  const tabs = [
    { id: 'appointments', path: '/appointments', icon: <Calendar size={24} />, label: t.appointments },
    { id: 'scan', path: '/scan', icon: <ScanLine size={28} />, label: t.scan, isCenter: true },
    { id: 'more', path: '/more', icon: <User size={24} />, label: t.more },
  ];

  const currentPath = location.pathname;

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-50">
      <div className="flex justify-between items-end pb-2">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.path;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="relative -top-6 flex flex-col items-center group"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isActive ? 'bg-app-gold text-white scale-110' : 'bg-app-text text-white'
                  }`}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] font-semibold mt-1 ${isActive ? 'text-app-gold' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 transition-colors w-16"
            >
              <div className={`p-1 ${isActive ? 'text-app-gold' : 'text-gray-400'}`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-app-gold font-semibold' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeamTabBar;
