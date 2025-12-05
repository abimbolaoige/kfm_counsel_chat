import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebaseConfig';
import { Mail, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';

const VerificationScreen: React.FC = () => {
    const { user, resendVerification, logout } = useAuth();
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleResend = async () => {
        setSending(true);
        setMessage('');
        setError('');
        try {
            const result = await resendVerification();
            if (result.success) {
                setMessage(result.message);
            } else {
                setError(result.message);
            }
        } catch (e) {
            setError('Failed to send verification email.');
        }
        setSending(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-slate-700">
                <div className="w-20 h-20 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Mail size={40} />
                </div>

                <h2 className="text-2xl font-bold font-serif mb-2 text-slate-900 dark:text-slate-100">Verify Your Email</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    We've sent a verification link to <span className="font-semibold text-slate-900 dark:text-slate-200">{user?.email}</span>.
                    <br />Please check your inbox (and spam folder) to confirm your account.
                </p>

                {message && (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm mb-4 flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} /> {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={handleResend}
                        disabled={sending}
                        className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {sending ? <RefreshCw className="animate-spin" size={20} /> : 'Resend Verification Email'}
                    </button>

                    <button
                        onClick={async () => {
                            const verified = await user?.reload().then(() => auth?.currentUser?.emailVerified);
                            if (verified) window.location.reload();
                            else setError("Email still not verified. Please check your inbox.");
                        }}
                        className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={20} /> I've Verified My Email
                    </button>

                    <button
                        onClick={logout}
                        className="w-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-medium py-2 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>

                <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
                    Once verified, please refresh this page or sign in again.
                </p>
            </div>
        </div>
    );
};

export default VerificationScreen;
