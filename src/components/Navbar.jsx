import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getFarmerProfile } from '../services/firebase';
import { Tractor, LayoutDashboard, Mic, ShieldCheck, FileText, Activity, Languages, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [farmerName, setFarmerName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const uid = localStorage.getItem('kisan_current_uid');
    if (uid) {
      getFarmerProfile(uid).then(profile => {
        if (profile) {
          setFarmerName(profile.name);
        }
      });
    }
  }, [location]);

  // If we are on landing or onboard, don't show the main navbar
  if (location.pathname === '/' || location.pathname === '/onboard') {
    return null;
  }

  const navItems = [
    { path: '/dashboard', label: t('dashboardTitle'), icon: LayoutDashboard },
    { path: '/chat', label: t('voiceAgent'), icon: Mic },
    { path: '/policy', label: t('policyAdvisorTitle'), icon: ShieldCheck },
    { path: '/claim', label: t('fileClaimTitle'), icon: FileText },
    { path: '/status', label: t('trackerTitle'), icon: Activity }
  ];

  return (
    <>
      {/* Top Navbar for Desktop / Large Screens */}
      <nav className="bg-white border-b border-green-100 sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Tractor className="w-7 h-7 text-primary-green" />
            <span className="text-xl font-bold text-textPrimary tracking-tight">
              KisanSaathi
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-green-50 text-primary-green' 
                      : 'text-textSecondary hover:text-primary-green hover:bg-green-50/50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right Action: Language Select and Farmer Profile Name */}
          <div className="flex items-center gap-3">
            {/* Language Selection Bar */}
            <div className="flex bg-green-50 border border-green-100 p-0.5 rounded-full">
              {[
                { code: 'pa', label: 'ਪੰਜਾਬੀ' },
                { code: 'hi', label: 'हिंदी' },
                { code: 'en', label: 'EN' }
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    language === lang.code
                      ? 'bg-primary-green text-white shadow-md'
                      : 'text-textPrimary hover:bg-green-100/50'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Farmer Profile Badge */}
            {farmerName && (
              <div className="hidden sm:flex items-center gap-2 bg-wheat/10 px-3 py-1.5 rounded-full border border-wheat-gold/20">
                <div className="w-6 h-6 rounded-full bg-wheat-gold text-white flex items-center justify-center font-bold text-xs uppercase">
                  {farmerName.charAt(0)}
                </div>
                <span className="text-xs font-bold text-textPrimary">{farmerName}</span>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button 
              className="md:hidden p-2 text-textSecondary" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[53px] bg-black/40 z-40 md:hidden animate-fadeIn" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-64 bg-white h-full border-r border-green-50 flex flex-col p-4 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 p-3 rounded-2xl text-base font-semibold transition-all ${
                    isActive 
                      ? 'bg-green-50 text-primary-green' 
                      : 'text-textSecondary hover:text-primary-green hover:bg-green-50/50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (App Feel) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50 md:hidden flex justify-around py-2 px-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'text-primary-green scale-105' 
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-semibold mt-1 truncate max-w-[64px]">
              {item.path === '/chat' ? 'Voice Agent' : item.label.split(' ')[0]}
            </span>
          </NavLink>
        ))}
      </div>
    </>
  );
}
