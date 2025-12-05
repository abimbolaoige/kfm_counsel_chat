
export type ViewState = 'home' | 'chat' | 'triage' | 'counselor' | 'prayer' | 'singles' | 'profile' | 'journal' | 'auth' | 'legal';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isSafetyWarning?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  createdAt: number;
  updatedAt: number;
  messageCount?: number;
}

export interface AssessmentOption {
  value: number;
  label: string;
}

export interface AssessmentQuestion {
  id: number;
  text: string;
  options: AssessmentOption[];
}

export interface AssessmentResult {
  score: number;
  summary: string;
  recommendation: string;
}

export interface TriageRecord {
  date: number;
  score: number;
  summary: string;
}

export interface UserProfile {
  name: string;
  spouseName: string;
  anniversary?: string;
  struggles?: string[];
  triageHistory?: TriageRecord[];
  accessPin?: string;
}

export interface UserState {
  name?: string;
  history: Message[];
}

export interface JournalEntry {
  id: string;
  date: number; // Timestamp
  text: string;
  category: 'prayer' | 'progress' | 'gratitude';
}

// Common props for view components
export interface ViewProps {
  setView: (view: ViewState) => void;
  showLegal: (tab: 'terms' | 'privacy') => void;
}
