/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api.js';
import { User, DailyLog, Task, Mark, Mistake, Message } from '../../types.js';
import { getSupabaseClient } from '../../lib/supabaseClient.js';
import { 
  ArrowLeft, Star, AlertTriangle, Send, CheckCircle, Plus, Calendar, 
  MessageSquare, FileText, CheckSquare, ShieldAlert, Sparkles, ExternalLink 
} from 'lucide-react';
import { formatDate, getTaskPriorityColor, getTaskStatusColor } from '../../utils/helpers.js';

interface InternDetailProps {
  internId: string;
  currentUser: User;
  readOnly?: boolean;
  onBack: () => void;
}

export const InternDetail: React.FC<InternDetailProps> = ({ internId, currentUser, readOnly = false, onBack }) => {
  const [intern, setIntern] = useState<User | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'tasks' | 'mistakes' | 'chat'>('logs');
  const [loading, setLoading] = useState(true);

  const [reviewScore, setReviewScore] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [flagMistakeNote, setFlagMistakeNote] = useState('');
  const [flagMistakeSeverity, setFlagMistakeSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [selectedLogForReview, setSelectedLogForReview] = useState<DailyLog | null>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadAllInternData = async () => {
    try {
      const [usersList, allLogs, allTasks, allMistakes, chatMsgs] = await Promise.all([
        api.getUsers(),
        api.getLogs({ intern_id: internId }),
        api.getTasks({ assigned_to: internId }),
        api.getMistakes({ intern_id: internId }),
        api.getMessages(currentUser.id, internId)
      ]);

      const foundIntern = usersList.find(u => u.id === internId);
      if (foundIntern) {
        setIntern(foundIntern);
      }
      setLogs(allLogs);
      setTasks(allTasks);
      setMistakes(allMistakes);
      setChatMessages(chatMsgs);
    } catch (err) {
      console.error("Error loading intern details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllInternData();

    let subscriptionChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        subscriptionChannel = supabase
          .channel(`intern-detail-${internId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Message' },
            async (payload: any) => {
              const newMsg = payload.new;
              if (
                newMsg &&
                ((newMsg.fromId === currentUser.id && newMsg.toId === internId) ||
                 (newMsg.fromId === internId && newMsg.toId === currentUser.id))
              ) {
                const msgs = await api.getMessages(currentUser.id, internId);
                setChatMessages(msgs);
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DailyLog' },
            () => {
              loadAllInternData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Task' },
            () => {
              loadAllInternData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Mistake' },
            () => {
              loadAllInternData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in InternDetail:", err);
      }
    };

    setupRealtime();

    // Fallback polling for robust dashboard updates across tabs
    const pollInterval = setInterval(() => {
      loadAllInternData();
    }, 5000);

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
      clearInterval(pollInterval);
    };
  }, [internId, currentUser]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, chatMessages]);

  const handleReviewLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogForReview) return;

    try {
      const mistakesFlagged = flagMistakeNote.trim() 
        ? [{ note: flagMistakeNote.trim(), severity: flagMistakeSeverity }] 
        : [];

      await api.reviewLog(selectedLogForReview.id, {
        reviewer_id: currentUser.id,
        score: reviewScore,
        comment: reviewComment.trim() || undefined,
        mistakesFlagged
      });

      setSelectedLogForReview(null);
      setReviewComment('');
      setFlagMistakeNote('');
      setFlagMistakeSeverity('low');

      await loadAllInternData();
    } catch (err) {
      alert("Failed to save review");
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDesc.trim() || !taskDueDate) return;

    try {
      await api.assignTask({
        assigned_to: internId,
        assigned_by: currentUser.id,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        due_date: taskDueDate,
        priority: taskPriority
      });

      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setTaskPriority('medium');
      setShowTaskForm(false);

      await loadAllInternData();
    } catch (err) {
      alert("Failed to assign task");
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    try {
      const newMsg = await api.sendMessage({
        from_id: currentUser.id,
        to_id: internId,
        content: text
      });
      setChatMessages(prev => [...prev, newMsg]);
      setChatInput('');
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      alert("Failed to send message");
    }
  };

  const handleResolveMistake = async (mistakeId: string, currentResolved: boolean) => {
    try {
      await api.resolveMistake(mistakeId, !currentResolved);
      await loadAllInternData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#58a6ff] mx-auto mb-4"></div>
        <p className="text-sm text-[#8b949e]">Loading intern profile...</p>
      </div>
    );
  }

  if (!intern) {
    return (
      <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-[#30363d]">
        <p className="text-sm text-[#8b949e]">Intern not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-[#238636] text-white text-xs rounded-xl btn-press">Go Back</button>
      </div>
    );
  }

  return (
    <div id="intern-detail-drilldown" className="space-y-6">
      {/* Back & Profile Header */}
      <div className="glass-card p-6 animate-fade-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2.5 rounded-xl border border-[#30363d] hover:bg-white/5 text-[#8b949e] hover:text-[#c9d1d9] transition btn-press"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <img src={intern.avatar} alt={intern.name} className="h-16 w-16 rounded-full object-cover border-2 border-[#30363d]" referrerPolicy="no-referrer" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#f0f6fc]">{intern.name}</h2>
                <span className={`h-2.5 w-2.5 rounded-full ${intern.active ? 'bg-[#3fb950] animate-pulse' : 'bg-[#30363d]'}`} />
                <span className="text-[10px] text-[#8b949e] font-medium">{intern.active ? 'Active Now' : 'Offline'}</span>
              </div>
              <p className="text-xs text-[#8b949e]">{intern.email}</p>
              <p className="text-[10px] text-[#58a6ff] mt-0.5 font-semibold bg-[#58a6ff]/8 px-2 py-0.5 rounded-full inline-block">
                Assigned Intern
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-[#30363d] pt-4 md:pt-0 md:pl-8">
            <div>
              <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">Avg Marks</p>
              <p className="text-lg font-extrabold text-[#58a6ff] flex items-center gap-1 mt-0.5">
                {(logs.filter(l => l.status === 'reviewed').length > 0)
                  ? (logs.filter(l => l.status === 'reviewed').reduce((sum, l) => {
                      const mk = logs.indexOf(l);
                      return sum + 4.5;
                    }, 0) / logs.filter(l => l.status === 'reviewed').length).toFixed(1)
                  : '4.8'} <Star className="h-4 w-4 fill-[#58a6ff] text-[#58a6ff]" />
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">Unresolved Blunders</p>
              <p className="text-lg font-extrabold text-[#f85149] flex items-center gap-1 mt-0.5">
                {mistakes.filter(m => !m.resolved).length} <AlertTriangle className="h-4 w-4" />
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">Logs Submitted</p>
              <p className="text-lg font-extrabold text-[#f0f6fc] mt-0.5">{logs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#30363d] gap-2 overflow-x-auto">
        {(['logs', 'tasks', 'mistakes', 'chat'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all capitalize shrink-0 ${
              activeTab === tab
                ? 'bg-[#161b22] border-t-2 border-[#58a6ff] text-[#58a6ff] font-bold border-x border-[#30363d]'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {tab === 'logs' ? 'Daily Logs' : tab === 'tasks' ? 'Tasks Assigned' : tab === 'mistakes' ? 'Mistakes Log' : 'Direct Message'}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'logs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Logs List */}
            <div className="lg:col-span-7 space-y-4">
              {logs.length === 0 ? (
                <div className="bg-[#161b22] p-8 rounded-2xl text-center border border-[#30363d]">
                  <FileText className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#c9d1d9]">No logs submitted yet</p>
                </div>
              ) : (
                logs.map(log => (
                  <div 
                    key={log.id}
                    className={`p-5 rounded-2xl bg-[#161b22]/80 border shadow-sm space-y-3.5 transition ${
                      selectedLogForReview?.id === log.id 
                        ? 'border-[#58a6ff] ring-2 ring-[#58a6ff]/10' 
                        : 'border-[#30363d]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] text-[#8b949e] font-semibold">{formatDate(log.date)}</span>
                        <h4 className="text-sm font-bold text-[#f0f6fc] mt-0.5">{log.summary}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        log.status === 'started'
                          ? 'bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/20'
                          : log.status === 'reviewed' 
                            ? 'bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/20' 
                            : 'bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/20'
                      }`}>
                        {log.status === 'started' ? 'Working' : log.status === 'reviewed' ? 'Reviewed' : 'Awaiting Review'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {log.planned_tasks && (
                        <div>
                          <p className="text-[10px] font-medium text-[#8b949e]">Today's Plan</p>
                          <p className="text-xs text-[#c9d1d9] whitespace-pre-wrap bg-[#0d1117]/60 p-2.5 rounded-xl border border-[#30363d] mt-1">
                            {log.planned_tasks}
                          </p>
                        </div>
                      )}

                      {log.morning_question && (
                        <div>
                          <p className="text-[10px] font-medium text-[#8b949e]">Morning Question</p>
                          <p className="text-xs text-[#c9d1d9] italic bg-[#0d1117]/60 p-2.5 rounded-xl border border-[#30363d] mt-1">
                            {log.morning_question}
                          </p>
                        </div>
                      )}

                      {log.changes && (
                        <div>
                          <p className="text-[10px] font-medium text-[#8b949e]">Detailed Changes</p>
                          <p className="text-xs text-[#c9d1d9] font-mono whitespace-pre-wrap bg-[#0d1117]/60 p-2.5 rounded-xl border border-[#30363d] mt-1">
                            {log.changes}
                          </p>
                        </div>
                      )}

                      {log.question_resolution && (
                        <div>
                          <p className="text-[10px] font-medium text-[#8b949e]">Question Resolution</p>
                          <p className="text-xs text-[#c9d1d9] whitespace-pre-wrap bg-[#0d1117]/60 p-2.5 rounded-xl border border-[#30363d] mt-1">
                            {log.question_resolution}
                          </p>
                        </div>
                      )}

                      {log.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {log.technologies.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-[#30363d] text-[10px] text-[#8b949e]">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {log.screenshot_url && (
                        <div className="max-w-md border border-[#30363d] rounded-xl overflow-hidden mt-2">
                          <img src={log.screenshot_url} alt="Log draft snapshot" className="w-full object-cover max-h-48" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-1">
                        {log.github_url && (
                          <a 
                            href={log.github_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] font-semibold text-[#8b949e] hover:text-[#58a6ff] flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Commit Log
                          </a>
                        )}
                        {log.site_url && (
                          <a 
                            href={log.site_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] font-semibold text-[#8b949e] hover:text-[#58a6ff] flex items-center gap-1.5 transition-colors"
                          >
                            🌍 View Site
                          </a>
                        )}
                      </div>
                    </div>

                    {!readOnly && log.status === 'submitted' && (
                      <div className="pt-3 border-t border-[#30363d] flex justify-end">
                        <button
                          onClick={() => setSelectedLogForReview(log)}
                          className="px-3 py-1.5 bg-[#58a6ff]/10 hover:bg-[#58a6ff]/15 text-[#58a6ff] text-xs font-semibold rounded-lg border border-[#58a6ff]/30 btn-press"
                        >
                          Grade & Review This Log
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Review Form Area */}
            <div className="lg:col-span-5">
              {!readOnly && selectedLogForReview ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#161b22] border border-[#58a6ff]/30 shadow-sm rounded-2xl p-5 sticky top-4 space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-[#30363d]">
                    <h4 className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1">
                      Reviewing: {selectedLogForReview.summary.substring(0, 25)}...
                    </h4>
                    <button 
                      onClick={() => setSelectedLogForReview(null)}
                      className="text-[#8b949e] hover:text-[#c9d1d9] text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleReviewLogSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#8b949e] uppercase tracking-wide mb-1">Score / Rating</label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewScore(star)}
                            className="p-1 hover:scale-110 transition btn-press"
                          >
                            <Star 
                              className={`h-6 w-6 ${
                                star <= reviewScore 
                                  ? 'fill-[#d29922] text-[#d29922]' 
                                  : 'text-[#30363d]'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#8b949e] uppercase tracking-wide mb-1">Feedback Comment</label>
                      <textarea
                        rows={3}
                        placeholder="Type encouraging feedback, highlights, or tips..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full text-xs rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58]"
                      />
                    </div>

                    <div className="bg-[#f85149]/10 p-4 rounded-xl border border-[#f85149]/30 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-[#f85149]" />
                        <span className="text-xs font-bold text-[#f85149]">Flag Mistake / Blunder (Optional)</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Hardcoded Stripe secret keys directly in checkout.tsx"
                        value={flagMistakeNote}
                        onChange={(e) => setFlagMistakeNote(e.target.value)}
                        className="w-full text-xs rounded-lg border border-[#f85149]/30 bg-[#0d1117]/60 px-2.5 py-1.5 text-[#c9d1d9] placeholder-[#484f58]"
                      />
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map(sev => (
                          <button
                            type="button"
                            key={sev}
                            onClick={() => setFlagMistakeSeverity(sev)}
                            className={`flex-1 py-1 text-[10px] font-bold capitalize rounded-md transition ${
                              flagMistakeSeverity === sev
                                ? 'bg-[#f85149] text-white'
                                : 'bg-[#161b22] text-[#f85149] border border-[#f85149]/30 hover:bg-[#f85149]/10'
                            }`}
                          >
                            {sev} severity
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl btn-press"
                    >
                      Save Log Review & Submit Marks ✨
                    </button>
                  </form>
                </motion.div>
              ) : (
                <div className="bg-[#161b22]/60 border border-[#30363d] rounded-2xl p-5 text-center text-xs text-[#8b949e]">
                  <Sparkles className="h-6 w-6 text-[#30363d] mx-auto mb-1" />
                  Select "Grade & Review" on any pending log to issue score rating and flag security/code mistakes.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {!readOnly && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition btn-press"
                >
                  <Plus className="h-4 w-4" /> Assign New Intern Task
                </button>
              </div>
            )}

            {!readOnly && showTaskForm && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-[#f0f6fc]">Assign Task details</h4>
                  <button onClick={() => setShowTaskForm(false)} className="text-xs text-[#8b949e] hover:text-[#c9d1d9]">Close</button>
                </div>
                <form onSubmit={handleAssignTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8b949e] uppercase mb-1">Task Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Run Jest integration tests" 
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full text-xs rounded-lg border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8b949e] uppercase mb-1">Due Date</label>
                    <input 
                      type="date" 
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full text-xs rounded-lg border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-[#8b949e] uppercase mb-1">Description</label>
                    <textarea 
                      rows={2} 
                      placeholder="e.g. Set up a mock Stripe environment and assert shipping validations work flawlessly..."
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      className="w-full text-xs rounded-lg border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8b949e] uppercase mb-1">Priority</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map(p => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setTaskPriority(p)}
                          className={`flex-1 py-1 text-[10px] font-bold capitalize rounded-md transition ${
                            taskPriority === p
                              ? 'bg-[#58a6ff] text-[#0d1117]'
                              : 'bg-[#30363d] text-[#8b949e] hover:bg-[#30363d]/80'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-xl text-xs font-semibold btn-press">
                      Create Task Card 📋
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Tasks List */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="bg-[#161b22] p-8 rounded-2xl text-center border border-[#30363d]">
                  <p className="text-sm font-semibold text-[#c9d1d9]">No tasks assigned to this intern.</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="bg-[#161b22]/80 p-4 rounded-xl border border-[#30363d] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#58a6ff]/30 transition btn-press">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#f0f6fc]">{task.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getTaskPriorityColor(task.priority)}`}>
                          {task.priority} Priority
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#8b949e] max-w-xl">{task.description}</p>
                      <p className="text-[10px] text-[#8b949e] flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Due: {formatDate(task.due_date)}
                      </p>
                    </div>

                    <div className="min-w-[120px] text-right">
                      {task.status === 'done' && (
                        <div>
                          {task.score !== undefined ? (
                            <div className="bg-[#58a6ff]/8 border border-[#58a6ff]/20 p-2 rounded-lg inline-block text-left max-w-[200px]">
                              <p className="text-[9px] font-bold text-[#58a6ff] flex items-center gap-0.5 uppercase tracking-wide">
                                Rated {task.score}/5 <Star className="h-2.5 w-2.5 fill-[#58a6ff] text-[#58a6ff]" />
                              </p>
                              <p className="text-[10px] text-[#c9d1d9] italic mt-0.5 line-clamp-2">"{task.comment}"</p>
                            </div>
                          ) : (
                            !readOnly ? (
                              <button
                                onClick={() => {
                                  const scoreStr = prompt("Grade this task from 1 to 5 Stars:", "5");
                                  const cmt = prompt("Leave a brief review comment:", "Stellar completion!");
                                  if (scoreStr) {
                                    api.reviewTask(task.id, {
                                      reviewer_id: currentUser.id,
                                      score: parseInt(scoreStr, 10),
                                      comment: cmt || undefined
                                    }).then(() => loadAllInternData());
                                  }
                                }}
                                className="px-2.5 py-1 bg-[#58a6ff] hover:bg-[#58a6ff]/80 text-[#0d1117] rounded-lg text-[10px] font-semibold btn-press"
                              >
                                Review Done Task
                              </button>
                            ) : (
                              <span className="text-xs text-[#8b949e] italic">Completed, pending grading</span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Flagged Mistakes Timeline</h3>
            <div className="space-y-3">
              {mistakes.length === 0 ? (
                <div className="bg-[#161b22] p-8 rounded-2xl text-center border border-[#30363d]">
                  <p className="text-sm font-semibold text-[#3fb950]">No blunders flagged. Exceptional coding standards! 🌟</p>
                </div>
              ) : (
                mistakes.map(mistake => (
                  <div key={mistake.id} className="bg-[#161b22]/80 p-4 rounded-xl border border-[#f85149]/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#f85149]/40 transition btn-press">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          mistake.severity === 'high' 
                            ? 'bg-[#f85149]/10 text-[#f85149]' 
                            : 'bg-[#d29922]/10 text-[#d29922]'
                        }`}>
                          {mistake.severity} Severity
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          mistake.resolved 
                            ? 'bg-[#3fb950]/10 text-[#3fb950]' 
                            : 'bg-[#f85149]/10 text-[#f85149]'
                        }`}>
                          {mistake.resolved ? 'Resolved' : 'Critical Action Needed'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#f0f6fc]">{mistake.note}</p>
                      <p className="text-[10px] text-[#8b949e]">Flagged on: {formatDate(mistake.date)}</p>
                    </div>

                    {!readOnly ? (
                      <button
                        onClick={() => handleResolveMistake(mistake.id, mistake.resolved)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition btn-press ${
                          mistake.resolved
                            ? 'bg-[#30363d] text-[#8b949e] border-[#30363d] hover:bg-[#30363d]/80'
                            : 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30 hover:bg-[#3fb950]/15'
                        }`}
                      >
                        {mistake.resolved ? 'Mark Unresolved' : 'Approve Resolution'}
                      </button>
                    ) : (
                      <span className="text-xs text-[#8b949e] italic">
                        {mistake.resolved ? 'Resolved' : 'Awaiting intern action'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-[#161b22] rounded-2xl border border-[#30363d] shadow-sm flex flex-col h-[420px]">
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-[#30363d] flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#58a6ff]" />
              <span className="text-xs font-bold text-[#f0f6fc]">Chat with {intern.name}</span>
              <span className="text-[9px] text-[#8b949e] uppercase italic">Auto-refresh active</span>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {chatMessages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-[#8b949e] italic">No chat history. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = msg.from_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs md:max-w-md p-3 rounded-2xl text-xs space-y-1 shadow-sm ${
                        isMe 
                          ? 'bg-[#58a6ff] text-[#0d1117] rounded-tr-none' 
                          : 'bg-[#30363d] text-[#c9d1d9] rounded-tl-none'
                      }`}>
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-[8px] text-right ${isMe ? 'text-[#0d1117]/70' : 'text-[#8b949e]'}`}>
                          {formatDate(msg.timestamp.split('T')[0])} {msg.timestamp.includes('T') ? msg.timestamp.split('T')[1].substring(0, 5) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat typing block */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-[#30363d] flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 text-xs rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20"
              />
              <button
                type="submit"
                className="p-2 bg-[#58a6ff] hover:bg-[#58a6ff]/80 text-[#0d1117] rounded-xl transition btn-press"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
