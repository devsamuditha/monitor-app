/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api.js';
import { User, Question, Reply } from '../../types.js';
import { MessageSquare, Send, Sparkles, UserCheck, CornerDownRight } from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers.js';
import { getSupabaseClient } from '../../lib/supabaseClient.js';

interface AskTeamThreadProps {
  currentUser: User;
}

export const AskTeamThread: React.FC<AskTeamThreadProps> = ({ currentUser }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyText, setReplyText] = useState<{ [qId: string]: string }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usersMap, setUsersMap] = useState<{ [id: string]: User }>({});

  const loadData = async () => {
    try {
      const [qs, users] = await Promise.all([
        api.getQuestions(),
        api.getUsers()
      ]);
      setQuestions(qs);
      
      const uMap: { [id: string]: User } = {};
      users.forEach(u => { uMap[u.id] = u; });
      setUsersMap(uMap);
    } catch (err: any) {
      console.error("Error loading questions", err);
      setError("Failed to load discussion boards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    let subscriptionChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        subscriptionChannel = supabase
          .channel('ask-the-team-discussion')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Question' },
            () => {
              loadData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Reply' },
            () => {
              loadData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in AskTeamThread:", err);
      }
    };

    setupRealtime();

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    };
  }, []);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please fill out both the title and question body.");
      return;
    }

    try {
      setError('');
      await api.askQuestion({
        intern_id: currentUser.id,
        title: title.trim(),
        content: content.trim()
      });
      setTitle('');
      setContent('');
      setSuccess("Question posted successfully! ✨");
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to post question.");
    }
  };

  const handlePostReply = async (questionId: string) => {
    const text = replyText[questionId]?.trim();
    if (!text) return;

    try {
      setError('');
      await api.replyToQuestion(questionId, {
        user_id: currentUser.id,
        content: text
      });
      setReplyText(prev => ({ ...prev, [questionId]: '' }));
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to post reply.");
    }
  };

  const getUserDetails = (userId: string) => {
    return usersMap[userId] || {
      id: userId,
      name: "Unknown User",
      avatar: "",
      role: "intern" as const
    };
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
      case 'tech_lead':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'manager') return 'Manager';
    if (role === 'tech_lead') return 'Tech Lead';
    return 'Intern';
  };

  return (
    <div id="ask-team-discussion-board" className="space-y-6 relative">
      {/* Ambient background */}
      <div className="ambient-bg">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>

      {/* Question Submission Form */}
      <div className="glass-card p-6 relative z-10">
        <h2 className="text-lg font-semibold text-[#f0f6fc] flex items-center gap-2 mb-1">
          Ask the Team <MessageSquare className="h-5 w-5 text-[#58a6ff]" />
        </h2>
        <p className="text-xs text-[#8b949e] mb-4">
          Stuck on a blocker, database schema issue, or need review guidance? Post your question here and let leads or managers jump in.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-xs animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-[#3fb950]/10 border border-[#3fb950]/30 text-[#3fb950] text-xs animate-fade-in">
            {success}
          </div>
        )}

        {/* Question Submission Form */}
        <form onSubmit={handleAskQuestion} className="space-y-3">
          <div>
            <input 
              type="text"
              placeholder="What are you struggling with? (e.g., Redis TTL policies)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 font-semibold"
            />
          </div>
          <div>
            <textarea
              rows={3}
              placeholder="Describe the context, what you have tried, and paste relevant logs or code snippets..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition btn-press"
            >
              Post Question <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Discussion List */}
      <div className="space-y-4 relative z-10">
        <h3 className="text-sm font-semibold text-[#c9d1d9]">Active Discussions</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58a6ff] mx-auto mb-2"></div>
            <p className="text-xs text-[#8b949e]">Loading channels...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-[#161b22]/40 border border-[#30363d] rounded-2xl py-12 text-center">
            <MessageSquare className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#c9d1d9]">All quiet in the discussion rooms</p>
            <p className="text-xs text-[#8b949e] mt-1">Be the first to post a question and start collaborating!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const author = getUserDetails(q.intern_id);
              return (
                <motion.div 
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 space-y-4"
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3">
                    <img src={author.avatar} alt={author.name} className="h-9 w-9 rounded-full object-cover border border-[#30363d]" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-[#f0f6fc]">{author.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getRoleBadge(author.role)}`}>
                          {getRoleLabel(author.role)}
                        </span>
                        <span className="text-[10px] text-[#8b949e]">{formatRelativeTime(q.timestamp)}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#f0f6fc]">{q.title}</h4>
                      <p className="text-sm text-[#c9d1d9] mt-1 whitespace-pre-wrap leading-relaxed">{q.content}</p>
                    </div>
                  </div>

                  {/* Threaded replies */}
                  {q.replies.length > 0 && (
                    <div className="pl-6 border-l-2 border-[#30363d] space-y-3.5 mt-2">
                      {q.replies.map((reply) => {
                        const replier = getUserDetails(reply.user_id);
                        const isLeadOrManager = replier.role === 'tech_lead' || replier.role === 'manager';
                        return (
                          <div key={reply.id} className="flex gap-2.5 items-start">
                            <CornerDownRight className="h-4 w-4 text-[#8b949e] mt-1 shrink-0" />
                            <img src={replier.avatar} alt={replier.name} className="h-7 w-7 rounded-full object-cover border border-[#30363d]" referrerPolicy="no-referrer" />
                            <div className="flex-1 bg-[#161b22]/60 p-3 rounded-xl min-w-0 border border-[#30363d]">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className="text-xs font-semibold text-[#f0f6fc]">{replier.name}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-semibold ${getRoleBadge(replier.role)}`}>
                                  {getRoleLabel(replier.role)}
                                </span>
                                {isLeadOrManager && (
                                  <span className="text-[9px] text-[#3fb950] flex items-center gap-0.5 bg-[#3fb950]/8 px-1 py-0.5 rounded font-medium">
                                    <UserCheck className="h-2.5 w-2.5" /> Approved Guide
                                  </span>
                                )}
                                <span className="text-[9px] text-[#8b949e] ml-auto">{formatRelativeTime(reply.timestamp)}</span>
                              </div>
                              <p className="text-xs text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reply Form */}
                  <div className="flex gap-2 pt-2 border-t border-[#30363d]">
                    <input 
                      type="text"
                      placeholder="Offer help or ask a follow-up question..."
                      value={replyText[q.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostReply(q.id)}
                      className="flex-1 text-xs rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50"
                    />
                    <button
                      onClick={() => handlePostReply(q.id)}
                      className="p-2 bg-[#58a6ff]/10 hover:bg-[#58a6ff]/15 text-[#58a6ff] rounded-xl transition btn-press"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
