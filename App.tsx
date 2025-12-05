
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import ChatInterface from './components/ChatInterface';
import ChatSessionList from './components/ChatSessionList';
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
import { ViewState, ChatSession } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { subscribeToChatSessions, createChatSession, deleteSession } from './services/dataService';

function AppContent() {
  const { user, isEmailVerified, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [safetyMode, setSafetyMode] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | null>(null);

  // Session management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

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

  // Load sessions
  useEffect(() => {
    if (user) {
      // Cloud mode: subscribe to sessions
      const unsubscribe = subscribeToChatSessions(user.id, (fetchedSessions) => {
        setSessions(fetchedSessions);
        // Auto-select first session or create one if none exist
        if (fetchedSessions.length > 0 && !activeSessionId) {
          setActiveSessionId(fetchedSessions[0].id);
        } else if (fetchedSessions.length === 0) {
          // Create first session
          createChatSession(user.id).then(sessionId => {
            setActiveSessionId(sessionId);
          });
        }
      });
      return () => unsubscribe();
    } else {
      // Guest mode: load from localStorage
      const sessionsKey = 'kfm_sessions_guest';
      const saved = localStorage.getItem(sessionsKey);
      if (saved) {
        try {
          const guestSessions = JSON.parse(saved);
          setSessions(guestSessions);
          if (guestSessions.length > 0 && !activeSessionId) {
            setActiveSessionId(guestSessions[0].id);
          }
        } catch (e) {
          console.error('Failed to load guest sessions', e);
        }
      }
      // Create first session for guests if none exist
      if (!saved || JSON.parse(saved).length === 0) {
        const newSessionId = `session_${Date.now()}`;
        const newSession = {
          id: newSessionId,
          title: 'New Conversation',
          preview: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 0
        };
        localStorage.setItem(sessionsKey, JSON.stringify([newSession]));
        setSessions([newSession]);
        setActiveSessionId(newSessionId);
      }
    }
  }, [user]);

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

  // Session handlers
  const handleNewSession = async () => {
    if (user) {
      const sessionId = await createChatSession(user.id);
      setActiveSessionId(sessionId);
    } else {
      // Guest mode
      const sessionsKey = 'kfm_sessions_guest';
      const newSessionId = `session_${Date.now()}`;
      const newSession = {
        id: newSessionId,
        title: 'New Conversation',
        preview: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0
      };
      const saved = localStorage.getItem(sessionsKey);
      const currentSessions = saved ? JSON.parse(saved) : [];
      const updatedSessions = [newSession, ...currentSessions];
      localStorage.setItem(sessionsKey, JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
      setActiveSessionId(newSessionId);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (user) {
      await deleteSession(user.id, sessionId);
      // Sessions will update via subscription
      if (activeSessionId === sessionId) {
        setActiveSessionId(sessions[0]?.id || null);
      }
    } else {
      // Guest mode
      const sessionsKey = 'kfm_sessions_guest';
      const saved = localStorage.getItem(sessionsKey);
      if (saved) {
        const currentSessions = JSON.parse(saved);
        const updatedSessions = currentSessions.filter((s: ChatSession) => s.id !== sessionId);
        localStorage.setItem(sessionsKey, JSON.stringify(updatedSessions));
        setSessions(updatedSessions);
        if (activeSessionId === sessionId) {
          setActiveSessionId(updatedSessions[0]?.id || null);
        }
      }
    }
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
        return (
          <div className="flex h-full">
            <div className="w-64 flex-shrink-0">
              <ChatSessionList
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewSession={handleNewSession}
                onDeleteSession={handleDeleteSession}
              />
            </div>
            <div className="flex-1">
              <ChatInterface
                triggerSafety={triggerSafety}
                showLegal={showLegal}
                activeSessionId={activeSessionId}
                onSessionChange={setActiveSessionId}
              />
            </div>
          </div>
        );
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
