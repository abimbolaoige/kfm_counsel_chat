
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import ChatInterface from './components/ChatInterface';
import TriageAssessment from './components/TriageAssessment';
import SinglesAssessment from './components/SinglesAssessment';
import EscalationForm from './components/EscalationForm';
import PrayerModule from './components/PrayerModule';
import ProfileSettings from './components/ProfileSettings';
import SafetyMode from './components/SafetyMode';
import JournalView from './components/JournalView';
import AuthScreen from './components/AuthScreen';
import LegalConsent from './components/LegalConsent';
import VerificationScreen from './components/VerificationScreen';
import { ViewState } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, isEmailVerified, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [safetyMode, setSafetyMode] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kfm_theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kfm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kfm_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const triggerSafety = () => setSafetyMode(true);
  const closeSafety = () => setSafetyMode(false);

  const handleSafetyEscalation = () => {
    setSafetyMode(false);
    setCurrentView('counselor');
  };

  const showLegal = (tab: 'terms' | 'privacy') => {
    setLegalDoc(tab);
  };

  const closeLegal = () => {
    setLegalDoc(null);
  };

  const renderView = () => {
    // If user is logged in but NOT verified, show Verification Screen
    // Exception: If they are on the 'auth' screen (which shouldn't happen if logged in, but just in case)
    if (user && !isEmailVerified) {
      return <VerificationScreen />;
    }

    switch (currentView) {
      case 'home':
        return <HomeView setView={setCurrentView} showLegal={showLegal} />;
      case 'chat':
        return <ChatInterface triggerSafety={triggerSafety} showLegal={showLegal} />;
      case 'triage':
        return <TriageAssessment setView={setCurrentView} showLegal={showLegal} />;
      case 'singles':
        return <SinglesAssessment setView={setCurrentView} showLegal={showLegal} />;
      case 'counselor':
        return <EscalationForm setView={setCurrentView} showLegal={showLegal} />;
      case 'prayer':
        return <PrayerModule setView={setCurrentView} showLegal={showLegal} />;
      case 'profile':
        return <ProfileSettings setView={setCurrentView} showLegal={showLegal} />;
      case 'journal':
        return <JournalView setView={setCurrentView} showLegal={showLegal} />;
      case 'auth':
        return <AuthScreen setView={setCurrentView} showLegal={showLegal} />;
      default:
        return <HomeView setView={setCurrentView} showLegal={showLegal} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-brand-100 dark:selection:bg-brand-900 flex flex-col transition-colors duration-200">
      {safetyMode && (
        <SafetyMode
          onClose={closeSafety}
          onEscalate={handleSafetyEscalation}
        />
      )}

      {legalDoc && (
        <LegalConsent initialTab={legalDoc} onClose={closeLegal} />
      )}

      <div className="w-full md:max-w-7xl mx-auto bg-white dark:bg-slate-900 min-h-screen md:min-h-[calc(100vh-2rem)] shadow-2xl relative flex flex-col md:my-4 md:rounded-2xl md:overflow-hidden border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <Navigation
          currentView={currentView}
          setView={setCurrentView}
          triggerSafety={triggerSafety}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        <main className="flex-1 relative overflow-hidden flex flex-col">
          {renderView()}
        </main>

        {currentView !== 'chat' && (
          <footer className="py-4 px-6 text-[10px] text-slate-400 dark:text-slate-500 text-center bg-white/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 backdrop-blur-sm safe-area-pb">
            <p className="font-medium mb-0.5">Disclaimer: This conversation is private but not a replacement for medical/legal advice.</p>
            <p>Safe, responsible response guidelines.</p>
          </footer>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
