import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Send, Trash2, UserCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function TaskComments({ taskId, workspaceId }: { taskId: string, workspaceId: string }) {
    const { user } = useAuth();
    const [comments, setComments] = setCommentsState();
    const [newComment, setNewComment] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Temp state custom hook for comments
    function setCommentsState() {
        return useState<any[]>([]);
    }

    useEffect(() => {
        if (taskId) fetchComments();
        if (workspaceId) fetchMembers();
    }, [taskId, workspaceId]);

    const fetchComments = async () => {
        try {
            const { data } = await api.get(`/tasks/${taskId}/comments`);
            setComments(data);
        } catch (error) {
            console.error('Failed to fetch comments', error);
        }
    };

    const fetchMembers = async () => {
        if (!workspaceId) return;
        try {
            const { data } = await api.get(`/workspaces/${workspaceId}`);
            setMembers(data.members || []);
        } catch (error) {
            console.error('Failed to fetch workspace members for mentions', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewComment(val);

        // Simple mention detection: triggers if the last word starts with @
        const words = val.split(' ');
        const lastWord = words[words.length - 1];

        if (lastWord.startsWith('@')) {
            setShowMentions(true);
            setMentionFilter(lastWord.slice(1).toLowerCase());
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (memberUser: any) => {
        const words = newComment.split(' ');
        words.pop(); // remove the partial @ment...
        const mentionText = `@${memberUser.name || memberUser.email} `;
        setNewComment(words.length > 0 ? words.join(' ') + ' ' + mentionText : mentionText);
        setShowMentions(false);
        inputRef.current?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        // Extract mentioned users based on names/emails in the text
        const mentionedIds = members
            .filter(m => newComment.includes(`@${m.user.name}`) || newComment.includes(`@${m.user.email}`))
            .map(m => m.user.id);

        try {
            await api.post(`/tasks/${taskId}/comments`, {
                content: newComment,
                mentions: mentionedIds
            });
            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Failed to add comment', error);
        }
    };

    const deleteComment = async (commentId: string) => {
        try {
            await api.delete(`/tasks/comments/${commentId}`);
            fetchComments();
        } catch (error) {
            console.error('Failed to delete comment', error);
        }
    };

    const filteredMembers = members.filter(m =>
        (m.user.name?.toLowerCase() || '').includes(mentionFilter) ||
        (m.user.email?.toLowerCase() || '').includes(mentionFilter)
    );

    return (
        <div className="mt-8 pt-6 border-t border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-800 mb-4">Comments</h3>

            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                {comments.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-2">No comments yet.</p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="bg-neutral-50 p-3 rounded-xl group relative">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <UserCircle size={16} className="text-neutral-400" />
                                    <span className="text-xs font-bold text-neutral-700">{c.user?.name || c.user?.email}</span>
                                    <span className="text-[10px] text-neutral-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                {user?.id === c.userId && (
                                    <button onClick={() => deleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all p-1">
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-neutral-800 whitespace-pre-wrap">{c.content}</p>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                {showMentions && filteredMembers.length > 0 && (
                    <div className="absolute bottom-full mb-1 left-0 w-full bg-white border border-neutral-200 shadow-lg rounded-lg overflow-hidden z-10 max-h-40 overflow-y-auto">
                        {filteredMembers.map(m => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => insertMention(m.user)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-50 last:border-0 flex overflow-hidden items-center gap-2"
                            >
                                <UserCircle size={14} className="text-brand-500 shrink-0" />
                                <span className="font-medium text-neutral-800 truncate">{m.user.name || m.user.email}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newComment}
                        onChange={handleInputChange}
                        placeholder="Write a comment... (Type @ to mention)"
                        className="flex-1 text-sm rounded-lg"
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 text-white rounded-lg transition-all"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
}
