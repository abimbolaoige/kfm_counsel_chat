
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ShieldAlert, User, Sparkles, Trash2, Mic, MicOff, Copy, Check, Volume2, VolumeX, Pencil, ExternalLink } from 'lucide-react';
import { Message, UserProfile } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { subscribeToChatHistory, saveChatMessage } from '../services/dataService';
import { SAFETY_REGEX } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface ChatInterfaceProps {
  triggerSafety: () => void;
  showLegal: (tab: 'terms' | 'privacy') => void;
}

const cleanText = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/__(.*?)__/g, '$1')     // Remove underline/bold
    .replace(/\[\[(.*?)\]\]/g, '$1') // Remove scripture brackets for speech/copy
    .replace(/^#+\s/gm, '')          // Remove headers
    .replace(/^\s*-\s/gm, '')        // Remove bullet points
    .replace(/\n{3,}/g, '\n\n')      // Collapse excessive newlines
    .trim();
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ triggerSafety, showLegal }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Terms Acceptance State
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  // Dynamic keys based on logged-in user
  const chatStorageKey = user ? `kfm_chat_${user.id}` : 'kfm_chat_guest';
  const profileStorageKey = user ? `kfm_profile_${user.id}` : 'kfm_profile_guest';

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }

    // Cleanup speech synthesis on unmount
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Audio Actions
  const handleSpeak = (text: string, id: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const cleaned = cleanText(text);
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(cleanText(text));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleEdit = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  // Load history logic (Cloud vs Local)
  useEffect(() => {
    if (user) {
      // CLOUD MODE: Subscribe to Firestore
      const unsubscribe = subscribeToChatHistory(user.id, (fetchedMessages) => {
        if (fetchedMessages && fetchedMessages.length > 0) {
          setMessages(fetchedMessages);
          // Assume terms accepted if returning user has history (simplified for UX)
          setTermsAccepted(true);
        } else {
          setMessages([{
            id: 'welcome',
            role: 'model',
            text: `Hello ${user.name}. I am KFM Counsel. How can I be a support to you today?`,
            timestamp: Date.now(),
          }]);
        }
      });
      return () => unsubscribe();
    } else {
      // GUEST MODE: Local Storage
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
          setTermsAccepted(true); // Auto-accept for returning guests with history
        } catch (e) {
          console.error("Failed to load chat history", e);
        }
      } else {
        setMessages([{
          id: 'welcome',
          role: 'model',
          text: "Hello. I am KFM Counsel, your Christian marriage relationship companion. How can I be a support to you today?",
          timestamp: Date.now(),
        }]);
      }
    }
  }, [user, chatStorageKey]);

  // Scroll on update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save to LocalStorage (Backup/Guest)
  useEffect(() => {
    if (!user && messages.length > 0) {
      localStorage.setItem(chatStorageKey, JSON.stringify(messages));
    }
  }, [messages, chatStorageKey, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      if (user) {
        alert("To clear cloud history, please use your Profile Settings (Full delete not implemented in this MVP).");
      } else {
        localStorage.removeItem(chatStorageKey);
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        setMessages([{
          id: Date.now().toString(),
          role: 'model',
          text: "Chat history cleared. How can I be a support to you today?",
          timestamp: Date.now(),
        }]);
      }
    }
  };

  // Enhanced Safety Check with Regex
  const checkForSafety = (text: string) => {
    const isUnsafe = SAFETY_REGEX.some(regex => regex.test(text));
    if (isUnsafe) {
      triggerSafety();
      return true;
    }
    return false;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };

    // Optimistic update
    setMessages(prev => [...prev, newUserMsg]);

    // Save to cloud if logged in
    if (user) {
      saveChatMessage(user.id, newUserMsg).catch(console.error);
    }

    if (checkForSafety(userText)) return;

    setIsLoading(true);

    try {
      // Inject Profile Context if available
      let textToSend = userText;
      const savedProfile = localStorage.getItem(profileStorageKey);
      let contextStr = "";

      if (savedProfile) {
        const profile: UserProfile = JSON.parse(savedProfile);
        contextStr += `\n[Context: User Name: ${profile.name}, Spouse: ${profile.spouseName}]`;
        if (profile.triageHistory && profile.triageHistory.length > 0) {
          const lastTriage = profile.triageHistory[profile.triageHistory.length - 1];
          contextStr += `\n[Case History: Latest Assessment Score: ${lastTriage.score}%, Summary: ${lastTriage.summary}]`;
        }
      }

      textToSend = textToSend + contextStr;

      const responseText = await sendMessageToGemini(textToSend);

      if (checkForSafety(responseText)) return;

      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText, // Keep raw format with brackets
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newAiMsg]);

      if (user) {
        saveChatMessage(user.id, newAiMsg).catch(console.error);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render text with clickable scriptures
  const renderMessageContent = (text: string) => {
    // First remove bold markdown formatting
    const textWithoutBold = text.replace(/\*\*(.*?)\*\*/g, '$1');

    // Split by [[Reference]] patterns
    const parts = textWithoutBold.split(/(\[\[.*?\]\])/g);

    return parts.map((part, index) => {
      const match = part.match(/^\[\[(.*?)\]\]$/);
      if (match) {
        const reference = match[1];
        const encodedRef = encodeURIComponent(reference);
        return (
          <a
            key={index}
            href={`https://www.biblegateway.com/passage/?search=${encodedRef}&version=NIV`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-blue-200 hover:text-white font-bold underline decoration-blue-300/50 underline-offset-2 transition-colors mx-0.5"
            title="Read Verse"
          >
            {reference}
            <ExternalLink size={10} />
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark relative transition-colors duration-200">
      <div className="absolute top-0 right-0 p-3 z-10 bg-gradient-to-b from-white/90 to-transparent dark:from-slate-900/90 w-full flex justify-end">
        <button
          onClick={clearHistory}
          className="p-2 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
          title="Clear History"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 scrollbar-hide w-full pt-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[75%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-auto mb-6
                      ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'}`}>
                  {msg.role === 'user' ? (
                    <User size={16} />
                  ) : <Sparkles size={16} />}
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <div className={`px-5 py-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap transition-colors duration-200
                          ${msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm'
                    }`}>
                    {msg.role === 'model' ? (
                      // Handle formatting for AI messages
                      <div className="prose-sm dark:prose-invert">
                        {renderMessageContent(msg.text)}
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>

                  {/* Message Actions */}
                  <div className={`flex items-center gap-2 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                      <>
                        <button
                          onClick={() => handleSpeak(msg.text, msg.id)}
                          className={`p-1.5 rounded-full transition-colors ${speakingId === msg.id ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          title={speakingId === msg.id ? "Stop Reading" : "Read Aloud"}
                        >
                          {speakingId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className={`p-1.5 rounded-full transition-colors ${copiedId === msg.id ? 'text-green-600 dark:text-green-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          title="Copy Text"
                        >
                          {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </>
                    )}
                    {msg.role === 'user' && (
                      <button
                        onClick={() => handleEdit(msg.text)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title="Edit Prompt"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start w-full">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center shadow-sm mt-auto mb-1">
                  <Sparkles size={16} />
                </div>
                <div className="bg-white dark:bg-slate-800 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                  <Loader2 className="animate-spin text-brand-500 dark:text-brand-400" size={18} />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">KFM Counsel is praying & thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-surface-light dark:bg-surface-dark p-4 safe-area-pb transition-colors duration-200 border-t border-slate-100 dark:border-slate-800/50">
        {!termsAccepted ? (
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-4 py-2">
            <div className="flex items-center gap-3 flex-1 justify-center md:justify-start">
              <input
                type="checkbox"
                id="chat-terms"
                checked={termsChecked}
                onChange={e => setTermsChecked(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <label htmlFor="chat-terms" className="text-xs md:text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                By chatting, you agree to our{' '}
                <button onClick={() => showLegal('terms')} className="text-brand-600 dark:text-brand-400 font-bold hover:underline">Terms</button>
                {' '}and{' '}
                <button onClick={() => showLegal('privacy')} className="text-brand-600 dark:text-brand-400 font-bold hover:underline">Privacy Policy</button>.
              </label>
            </div>
            <button
              onClick={() => setTermsAccepted(true)}
              disabled={!termsChecked}
              className="w-full md:w-auto px-8 py-3 bg-brand-600 text-white font-bold rounded-full shadow-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            <div className="max-w-3xl mx-auto relative flex items-center gap-3">
              <button
                onClick={toggleListening}
                className={`p-3.5 rounded-full shadow-md transition-all active:scale-95 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isListening ? "Listening..." : "Type your message..."}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-0 text-slate-800 dark:text-slate-200 text-base rounded-full px-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400 dark:placeholder-slate-500 shadow-inner transition-colors duration-200"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-brand-600 text-white p-3.5 rounded-full shadow-material-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 disabled:shadow-none"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-3 pb-1 max-w-xl mx-auto leading-tight opacity-80">
              <p>Disclaimer: This is AI-generated advice. For emergencies, Use "Need Human Help?" icon.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
