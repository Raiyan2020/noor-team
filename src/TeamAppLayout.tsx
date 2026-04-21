import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TeamTabBar from './components/TeamTabBar';
import LoginPage from './pages/LoginPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ScanPage from './pages/ScanPage';
import MorePage from './pages/MorePage';
import ClientProfilePage from './pages/ClientProfilePage';
import { isLoggedIn, clearAuth } from './services/authStorage';
import { getLang } from './services/i18n';


const TeamAppLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    return (getLang() as 'ar' | 'en') || 'ar';
  });

  useEffect(() => {
    setIsAuthenticated(isLoggedIn());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('salon_team_lang', lang);
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearAuth();
    setIsAuthenticated(false);
  };

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show TabBar on main pages only, hide on detail pages if needed
  const showTabBar = location.pathname !== '/scan';

  return (
    <div className="w-full max-w-[430px] bg-app-bg max-h-screen min-h-screen shadow-2xl relative flex flex-col overflow-hidden font-alexandria mx-auto">
      <div className="flex-1 overflow-y-auto no-scrollbar relative pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/appointments" replace />} />
          <Route path="appointments" element={<AppointmentsPage lang={lang} />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="more" element={<MorePage onLogout={handleLogout} lang={lang} toggleLang={toggleLang} />} />
          <Route path="client/:clientId" element={<ClientProfilePage lang={lang} />} />
          <Route path="*" element={<Navigate to="/appointments" replace />} />
        </Routes>
      </div>
      {showTabBar && <TeamTabBar lang={lang} />}
    </div>
  );
};

export default TeamAppLayout;

