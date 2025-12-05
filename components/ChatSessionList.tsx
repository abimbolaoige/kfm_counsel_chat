import React from 'react';
import { Plus, MessageSquare, Trash2, MoreVertical } from 'lucide-react';
import { ChatSession } from '../types';

interface ChatSessionListProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewSession: () => void;
    onDeleteSession: (sessionId: string) => void;
}

const ChatSessionList: React.FC<ChatSessionListProps> = ({
    sessions,
    activeSessionId,
    onSelectSession,
    onNewSession,
    onDeleteSession
}) => {
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    const handleDelete = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            onDeleteSession(sessionId);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={onNewSession}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    New Conversation
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
                {sessions.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                        <MessageSquare size={48} className="mx-auto mb-2 opacity-30" />
                        <p>No conversations yet</p>
                        <p className="text-xs mt-1">Start a new one above</p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                className={`group relative p-3 rounded-lg cursor-pointer transition-all ${activeSessionId === session.id
                                        ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm font-medium truncate ${activeSessionId === session.id
                                                ? 'text-brand-700 dark:text-brand-300'
                                                : 'text-slate-700 dark:text-slate-300'
                                            }`}>
                                            {session.title}
                                        </h3>
                                        {session.preview && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                                                {session.preview}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-slate-500">
                                            <span>{session.messageCount || 0} messages</span>
                                            <span>•</span>
                                            <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleDelete(session.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-all"
                                        title="Delete conversation"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSessionList;
