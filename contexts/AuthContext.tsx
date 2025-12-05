
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth, configError } from '../firebaseConfig';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification
} from 'firebase/auth';
import { ShieldAlert, Settings } from 'lucide-react';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isFeaturesUnlocked: boolean;
    isEmailVerified: boolean;
    reloadUser: () => Promise<boolean>;
    unlockFeatures: () => void;
    lockFeatures: () => void;
    login: (email: string, pass: string) => Promise<{ success: boolean, message: string }>;
    signup: (email: string, pass: string, name: string) => Promise<{ success: boolean, message: string }>;
    verifyAccount: (email: string, code: string) => Promise<{ success: boolean, message: string }>;
    resendVerification: () => Promise<{ success: boolean, message: string }>;
    requestPasswordReset: (email: string) => Promise<{ success: boolean, message: string }>;
    confirmPasswordReset: (email: string, code: string, newPass: string) => Promise<{ success: boolean, message: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFeaturesUnlocked, setIsFeaturesUnlocked] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    useEffect(() => {
        // If config is missing, stop loading and let the UI handle it
        if (configError || !auth) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || '',
                    photoUrl: firebaseUser.photoURL || undefined
                });
                setIsEmailVerified(firebaseUser.emailVerified);
            } else {
                setUser(null);
                setIsFeaturesUnlocked(false);
                setIsEmailVerified(false);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const reloadUser = async () => {
        if (auth?.currentUser) {
            await auth.currentUser.reload();
            setIsEmailVerified(auth.currentUser.emailVerified);
            return auth.currentUser.emailVerified;
        }
        return false;
    };

    const unlockFeatures = () => setIsFeaturesUnlocked(true);
    const lockFeatures = () => setIsFeaturesUnlocked(false);

    const login = async (email: string, pass: string) => {
        try {
            if (!auth) throw new Error("System not configured");
            await signInWithEmailAndPassword(auth, email, pass);
            return { success: true, message: 'Login successful' };
        } catch (error: any) {
            console.error("Login Error:", error);
            let msg = error.message || "Login failed";
            if (error.code === 'auth/invalid-credential') msg = "Invalid email or password";
            if (error.code === 'auth/user-not-found') msg = "User not found";
            if (error.code === 'auth/wrong-password') msg = "Incorrect password";
            return { success: false, message: msg };
        }
    };

    const signup = async (email: string, pass: string, name: string) => {
        try {
            if (!auth) throw new Error("System not configured");
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

            // Update display name
            await updateProfile(userCredential.user, {
                displayName: name
            });

            // Send Verification Email
            try {
                await sendEmailVerification(userCredential.user);
            } catch (emailErr) {
                console.warn("Verification email failed to send:", emailErr);
            }

            // Force update local state immediately for better UI response
            setUser({
                id: userCredential.user.uid,
                name: name,
                email: email
            });

            return { success: true, message: 'Account created. Verification email sent.' };
        } catch (error: any) {
            console.error("Signup Error:", error);
            // Fallback to the raw error message so you can see exactly what is wrong
            let msg = error.message || "Signup failed";

            if (error.code === 'auth/email-already-in-use') msg = "Email already registered";
            if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters";
            if (error.code === 'auth/operation-not-allowed') msg = "Email/Password sign-in is not enabled in Firebase Console.";
            if (error.code === 'auth/network-request-failed') msg = "Network error. Check your connection.";

            return { success: false, message: msg };
        }
    };

    const verifyAccount = async (email: string, code: string) => {
        // Logic handled via link in Firebase, kept for interface
        return { success: true, message: 'Verification is handled via email link.' };
    };

    const resendVerification = async () => {
        if (auth && auth.currentUser) {
            try {
                await sendEmailVerification(auth.currentUser);
                return { success: true, message: "Verification email sent." };
            } catch (e: any) {
                return { success: false, message: e.message };
            }
        }
        return { success: false, message: "No user logged in." };
    };

    const requestPasswordReset = async (email: string) => {
        try {
            if (!auth) throw new Error("System not configured");
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: 'Reset link sent to your email.' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to send reset email.' };
        }
    };

    const confirmPasswordReset = async () => {
        // In Firebase, reset happens on a dedicated web handler
        return { success: true, message: 'Please check your email and follow the link to reset your password.' };
    };

    const logout = async () => {
        try {
            if (auth) await signOut(auth);
            setUser(null);
            setIsFeaturesUnlocked(false);
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    // --- Render Setup Screen if Config Missing ---
    if (configError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-red-100 dark:border-red-900/50">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Setup Required</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        To run this app in Production Mode, you must connect it to a Firebase backend.
                    </p>

                    <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-left text-xs font-mono overflow-auto mb-6 border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 mb-2">// firebaseConfig.ts</p>
                        <p className="text-slate-700 dark:text-slate-300">const firebaseConfig = &#123;</p>
                        <p className="text-slate-700 dark:text-slate-300 pl-4">apiKey: "YOUR_API_KEY",</p>
                        <p className="text-slate-700 dark:text-slate-300 pl-4">authDomain: "YOUR_PROJECT.firebaseapp.com",</p>
                        <p className="text-slate-700 dark:text-slate-300 pl-4">projectId: "YOUR_PROJECT_ID",</p>
                        <p className="text-slate-700 dark:text-slate-300 pl-4">...</p>
                        <p className="text-slate-700 dark:text-slate-300">&#125;;</p>
                    </div>

                    <div className="text-left space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <p className="flex items-center gap-2">
                            <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 underline font-bold">Firebase Console</a>
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            Create Project &gt; Add Web App &gt; Enable Auth & Firestore
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                            Copy config keys into <code>firebaseConfig.ts</code>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isFeaturesUnlocked,
            isEmailVerified,
            reloadUser,
            unlockFeatures,
            lockFeatures,
            login,
            signup,
            verifyAccount,
            resendVerification,
            requestPasswordReset,
            confirmPasswordReset,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
