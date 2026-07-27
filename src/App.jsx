import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';

// Import Pages
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import PolicyAdvisor from './pages/PolicyAdvisor';
import ClaimFiling from './pages/ClaimFiling';
import ClaimTracker from './pages/ClaimTracker';
import Architecture from './pages/Architecture';
import Enroll from './pages/Enroll';

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="min-h-screen bg-farmBg flex flex-col font-sans">
          {/* Main Navigation Bar */}
          <Navbar />

          {/* Page Routing */}
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/onboard" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/policy" element={<PolicyAdvisor />} />
              <Route path="/claim" element={<ClaimFiling />} />
              <Route path="/status" element={<ClaimTracker />} />
              <Route path="/architecture" element={<Architecture />} />
              <Route path="/enroll" element={<Enroll />} />
            </Routes>
          </div>
        </div>
      </Router>
    </LanguageProvider>
  );
}
