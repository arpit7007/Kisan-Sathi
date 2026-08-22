import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { safeStr } from '../utils/safeStr';
import { getFarmerProfile } from '../services/firebase';
import { 
  Tractor, LayoutDashboard, Mic, ShieldCheck, FileText, 
  Activity, Menu, X, Layers, User, ChevronRight 
} from 'lucide-react';

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

  // Hide Navbar on Landing, Onboarding, or Tech Architecture pages
  if (location.pathname === '/' || location.pathname === '/onboard' || location.pathname === '/architecture') {
    return null;
  }

  const navItems = [
    { path: '/dashboard', label: t('navDashboard') || 'Dashboard', icon: LayoutDashboard },
    { path: '/chat', label: t('navChat') || 'Voice AI', icon: Mic },
    { path: '/enroll', label: t('navEnroll') || 'Enrollment', icon: ShieldCheck },
    { path: '/policy', label: t('navPolicy') || 'Policies', icon: ShieldCheck },
    { path: '/claim', label: t('navClaim') || 'File Claim', icon: FileText },
    { path: '/status', label: t('navStatus') || 'Tracker', icon: Activity }
  ];

  return (
    <>
      {/* Top Glassmorphic Navbar for Desktop & Large Screens */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* BRAND LOGO */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-800 text-white flex items-center justify-center shadow-sm shadow-green-200 group-hover:scale-105 transition-transform duration-200">
              <Tractor className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-textPrimary tracking-tight leading-none group-hover:text-primary-green transition-colors">
                KisanSaathi
              </span>
              <span className="text-[10px] font-semibold text-wheat-gold font-gurmukhi leading-none mt-0.5">
                ਕਿਸਾਨ ਸਾਥੀ
              </span>
            </div>
          </div>

          {/* DESKTOP NAVIGATION LINKS (EQUALLY PLACED & STYLED) */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-green-50/90 text-primary-green font-extrabold shadow-xs border border-green-200/60' 
                      : 'text-gray-600 hover:text-primary-green hover:bg-gray-50 font-semibold'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{safeStr(item.label, language)}</span>
              </NavLink>
            ))}
          </div>

          {/* RIGHT ACTION BAR: LANGUAGE SELECTOR & USER PROFILE */}
          <div className="flex items-center gap-2.5">
            {/* Segmented Language Selector */}
            <div className="flex bg-gray-100/90 p-1 rounded-full border border-gray-200/60 shadow-inner">
              {[
                { code: 'pa', label: 'ਪੰਜਾਬੀ' },
                { code: 'hi', label: 'हिंदी' },
                { code: 'en', label: 'EN' }
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                    language === lang.code
                      ? 'bg-primary-green text-white shadow-sm'
                      : 'text-gray-600 hover:text-textPrimary hover:bg-gray-200/50'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Farmer Profile Badge */}
            {farmerName && (
              <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100/40 px-3 py-1 rounded-full border border-amber-200/60 shadow-xs">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {farmerName.charAt(0)}
                </div>
                <span className="text-xs font-bold text-textPrimary truncate max-w-[120px]">
                  {farmerName}
                </span>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button 
              className="md:hidden p-2 rounded-xl text-gray-600 hover:text-textPrimary hover:bg-gray-100 transition-colors" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 top-[65px] bg-black/40 backdrop-blur-xs z-40 md:hidden animate-fadeIn" 
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="w-72 bg-white h-full border-r border-green-100 flex flex-col justify-between p-5 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest px-3 block mb-2">
                Navigation
              </span>
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => 
                    `flex items-center justify-between p-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-green-50 text-primary-green font-bold border border-green-200/60 shadow-xs' 
                        : 'text-gray-700 hover:text-primary-green hover:bg-gray-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-primary-green" />
                    <span>{safeStr(item.label, language)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </NavLink>
              ))}
            </div>

            {/* Tech Stack & Architecture link in drawer */}
            <div className="border-t border-gray-100 pt-4">
              <NavLink
                to="/architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-gray-600 hover:text-primary-green hover:bg-green-50/50 transition-all border border-gray-100"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-primary-green" />
                  <span>Tech Stack & Architecture</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </NavLink>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM APP NAVIGATION BAR (EQUAL SPACING & APP FEEL) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-green-100/80 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-50 md:hidden flex items-center justify-between py-1.5 px-2">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-primary-green font-extrabold scale-105' 
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5 truncate max-w-[58px]">
              {safeStr(item.label, language).split(' ')[0]}
            </span>
          </NavLink>
        ))}
      </div>
    </>
  );
}
