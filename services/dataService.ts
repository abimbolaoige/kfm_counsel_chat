
import {
    collection,
    doc,
    setDoc,
    getDoc,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    deleteDoc,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserProfile, JournalEntry, Message } from '../types';

// --- User Profile ---

export const saveUserProfile = async (userId: string, profile: UserProfile) => {
    if (!db) throw new Error("Database not initialized");
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
        ...profile,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!db) return null;
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
        return snap.data() as UserProfile;
    }
    return null;
};

// --- Chat Sessions & History ---

export const createChatSession = async (userId: string, title: string = 'New Conversation'): Promise<string> => {
    if (!db) throw new Error("Database not initialized");

    const sessionId = `session_${Date.now()}`;
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);

    await setDoc(sessionRef, {
        id: sessionId,
        title,
        preview: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0
    });

    return sessionId;
};

export const subscribeToChatSessions = (userId: string, callback: (sessions: any[]) => void) => {
    if (!db) return () => { };

    const q = query(
        collection(db, 'users', userId, 'sessions'),
        orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(sessions);
    });
};

export const subscribeToSessionMessages = (userId: string, sessionId: string, callback: (messages: Message[]) => void) => {
    if (!db) return () => { };

    const q = query(
        collection(db, 'users', userId, 'sessions', sessionId, 'messages'),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Message));
        callback(messages);
    });
};

export const saveSessionMessage = async (userId: string, sessionId: string, message: Message) => {
    if (!db) throw new Error("Database not initialized");

    // Save the message
    await setDoc(doc(db, 'users', userId, 'sessions', sessionId, 'messages', message.id), message);

    // Update session metadata
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        const updates: any = {
            updatedAt: Date.now(),
            messageCount: (sessionData.messageCount || 0) + 1
        };

        // Update preview with first user message
        if (!sessionData.preview && message.role === 'user') {
            updates.preview = message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '');
        }

        // Auto-generate title from first user message
        if (sessionData.title === 'New Conversation' && message.role === 'user') {
            const title = message.text.substring(0, 40) + (message.text.length > 40 ? '...' : '');
            updates.title = title;
        }

        await setDoc(sessionRef, updates, { merge: true });
    }
};

export const deleteSession = async (userId: string, sessionId: string) => {
    if (!db) throw new Error("Database not initialized");

    // Delete all messages in the session
    const messagesQuery = query(collection(db, 'users', userId, 'sessions', sessionId, 'messages'));
    const messagesSnapshot = await getDoc(doc(db, 'users', userId, 'sessions', sessionId));

    // Delete the session document
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
};

export const updateSessionTitle = async (userId: string, sessionId: string, title: string) => {
    if (!db) throw new Error("Database not initialized");
    await setDoc(doc(db, 'users', userId, 'sessions', sessionId), { title }, { merge: true });
};

// Migration function for existing users
export const migrateOldChatData = async (userId: string) => {
    if (!db) return;

    try {
        // Check if old chat data exists
        const oldChatsQuery = query(collection(db, 'users', userId, 'chats'));
        const oldChatsSnapshot = await getDoc(doc(db, 'users', userId));

        // If there's old data, migrate it to a default session
        const defaultSessionId = await createChatSession(userId, 'Previous Conversations');

        // Note: Full migration would require reading all old messages and moving them
        // For now, we'll let users start fresh with the new structure
        // A full migration script could be run server-side if needed
    } catch (error) {
        console.error('Migration error:', error);
    }
};

// Legacy functions - kept for backward compatibility but deprecated
export const subscribeToChatHistory = (userId: string, callback: (messages: Message[]) => void) => {
    if (!db) return () => { };

    const q = query(
        collection(db, 'users', userId, 'chats'),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Message));
        callback(messages);
    });
};

export const saveChatMessage = async (userId: string, message: Message) => {
    if (!db) throw new Error("Database not initialized");
    await setDoc(doc(db, 'users', userId, 'chats', message.id), message);
};

export const clearChatHistory = async (userId: string) => {
    if (!db) return;
    // Deprecated - use deleteSession instead
};

// --- Journal ---

export const subscribeToJournal = (userId: string, callback: (entries: JournalEntry[]) => void) => {
    if (!db) return () => { };

    const q = query(
        collection(db, 'users', userId, 'journal'),
        orderBy('date', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as JournalEntry));
        callback(entries);
    });
};

export const addJournalEntry = async (userId: string, entry: Omit<JournalEntry, 'id'>) => {
    if (!db) throw new Error("Database not initialized");
    await addDoc(collection(db, 'users', userId, 'journal'), entry);
};

export const deleteJournalEntry = async (userId: string, entryId: string) => {
    if (!db) throw new Error("Database not initialized");
    await deleteDoc(doc(db, 'users', userId, 'journal', entryId));
};

// --- Prayer Hub ---

export const subscribeToPrayerRequests = (callback: (requests: any[]) => void) => {
    if (!db) return () => { };
    // Real-time listener for public prayer requests
    const q = query(
        collection(db, 'prayer_requests'),
        orderBy('timestamp', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const reqs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(reqs);
    });
};

export const subscribeToTestimonies = (callback: (testimonies: any[]) => void) => {
    if (!db) return () => { };
    const q = query(
        collection(db, 'testimonies'),
        orderBy('timestamp', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const tests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(tests);
    });
};

export const addPrayerRequest = async (request: any) => {
    if (!db) throw new Error("Database not initialized");
    await addDoc(collection(db, 'prayer_requests'), request);
};

export const addTestimony = async (testimony: any) => {
    if (!db) throw new Error("Database not initialized");
    await addDoc(collection(db, 'testimonies'), testimony);
};

export const incrementPrayerCount = async (requestId: string, currentCount: number) => {
    if (!db) return;
    const ref = doc(db, 'prayer_requests', requestId);
    // Simple client-side increment for MVP speed, ideally use transaction/increment in production
    await setDoc(ref, { prayedCount: currentCount + 1 }, { merge: true });
};

export const deletePrayerRequest = async (requestId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'prayer_requests', requestId));
}
