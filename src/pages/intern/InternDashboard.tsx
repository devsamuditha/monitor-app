/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api.js';
import { User, DailyLog, Task, Mistake, Mark } from '../../types.js';
import { getSupabaseClient } from '../../lib/supabaseClient.js';
import { DailyLogForm } from '../../components/intern/DailyLogForm.js';
import { StartDayForm } from '../../components/intern/StartDayForm.js';
import { 
  Flame, Award, CheckSquare, Clock, AlertTriangle, Github, 
  ExternalLink, Calendar, Search, Check, Play, ArrowRight, ShieldAlert
} from 'lucide-react';
import { formatDate } from '../../utils/helpers.js';

interface InternDashboardProps {
  user: User;
  onRefreshStats?: () => void;
}

export const InternDashboard: React.FC<InternDashboardProps> = ({ user, onRefreshStats }) => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [streak, setStreak] = useState(0);
  const [avgMark, setAvgMark] = useState<number | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const loadAllDashboardData = async () => {
    try {
      const [allLogs, allTasks, allMistakes, allMarks, allAnalytics] = await Promise.all([
        api.getLogs({ intern_id: user.id }),
        api.getTasks({ assigned_to: user.id }),
        api.getMistakes({ intern_id: user.id }),
        api.getMarks(user.id),
        api.getAnalytics()
      ]);

      setLogs(allLogs);
      setTasks(allTasks);
      setMistakes(allMistakes);
      setMarks(allMarks);

      // Find streak and avg marks from roster data in analytics
      if (allAnalytics && allAnalytics.rosterData) {
        const myData = allAnalytics.rosterData.find((r: any) => r.intern.id === user.id);
        if (myData) {
          setStreak(myData.streak);
          setAvgMark(myData.avgMark || 4.8);
        }
      }
    } catch (err) {
      console.error("Error loading intern dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDashboardData();

    let subscriptionChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        subscriptionChannel = supabase
          .channel(`intern-dashboard-${user.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DailyLog' },
            () => {
              loadAllDashboardData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Task' },
            () => {
              loadAllDashboardData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Mark' },
            () => {
              loadAllDashboardData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Mistake' },
            () => {
              loadAllDashboardData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'User' },
            () => {
              loadAllDashboardData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in InternDashboard:", err);
      }
    };

    setupRealtime();

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    };
  }, [user]);

  const handleTaskStatusToggle = async (taskId: string, currentStatus: 'todo' | 'in_progress' | 'done') => {
    let nextStatus: 'todo' | 'in_progress' | 'done' = 'in_progress';
    if (currentStatus === 'todo') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'done';
    else if (currentStatus === 'done') nextStatus = 'todo';

    try {
      await api.updateTaskStatus(taskId, nextStatus);
      await loadAllDashboardData();
      if (onRefreshStats) onRefreshStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogSubmitSuccess = () => {
    loadAllDashboardData();
    if (onRefreshStats) onRefreshStats();
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        log.changes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.technologies.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchDate = dateFilter ? log.date === dateFilter : true;
    return matchSearch && matchDate;
  });

  const completedTasksCount = tasks.filter(t => t.status === 'done').length;

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#58a6ff] mx-auto mb-4"></div>
        <p className="text-sm text-[#8b949e]">Syncing learning workspace...</p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLog = logs.find(l => l.date === todayStr);
  const isDayStarted = todaysLog && todaysLog.status === 'started';
  const isDaySubmitted = todaysLog && (todaysLog.status === 'submitted' || todaysLog.status === 'reviewed');

  return (
    <div id="intern-workspace-root" className="space-y-6 relative">
      {/* Ambient background */}
      <div className="ambient-bg">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      
      {/* Stats Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak card */}
        <div className="glass-card p-5 flex items-center gap-4 animate-fade-up stagger-1">
          <div className="bg-[#d29922]/10 text-[#d29922] p-3 rounded-xl">
            <Flame className="h-6 w-6 fill-[#d29922] animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e] font-bold uppercase tracking-wide">Journal Streak</p>
            <p className="text-xl font-black text-[#f0f6fc] mt-0.5">{streak > 0 ? `${streak}-Day Streak 🔥` : '0-Day Streak ❄️'}</p>
          </div>
        </div>

        {/* Avg Marks card */}
        <div className="glass-card p-5 flex items-center gap-4 animate-fade-up stagger-2">
          <div className="bg-[#58a6ff]/10 text-[#58a6ff] p-3 rounded-xl">
            <Award className="h-6 w-6 fill-[#58a6ff]/20" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e] font-bold uppercase tracking-wide">Average Score</p>
            <p className="text-xl font-black text-[#f0f6fc] mt-0.5">{avgMark !== null && avgMark > 0 ? `${avgMark.toFixed(1)} / 5.0 ⭐` : 'No scores yet ⭐'}</p>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-card p-5 flex items-center gap-4 animate-fade-up stagger-3">
          <div className="bg-[#3fb950]/10 text-[#3fb950] p-3 rounded-xl">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e] font-bold uppercase tracking-wide">Tasks Completed</p>
            <p className="text-xl font-black text-[#f0f6fc] mt-0.5">{completedTasksCount} / {tasks.length}</p>
          </div>
        </div>

        {/* Total Logs */}
        <div className="glass-card p-5 flex items-center gap-4 animate-fade-up stagger-4">
          <div className="bg-[#58a6ff]/10 text-[#58a6ff] p-3 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e] font-bold uppercase tracking-wide">Logs Submitted</p>
            <p className="text-xl font-black text-[#f0f6fc] mt-0.5">{logs.length} entries</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Log Form & Flagged Mistakes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Daily Log entry Form */}
          <div className="glass-card animate-fade-up stagger-2">
            {!todaysLog ? (
              <StartDayForm user={user} onSuccess={handleLogSubmitSuccess} />
            ) : isDayStarted ? (
              <DailyLogForm user={user} startedLog={todaysLog} onSuccess={handleLogSubmitSuccess} />
            ) : (
              <div className="p-8 text-center space-y-3 bg-[#238636]/10 border border-[#238636]/20 rounded-2xl">
                <div className="bg-[#238636] text-white p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-lg shadow-[#238636]/20">
                  <Check className="h-6 w-6 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#f0f6fc]">Day Completed!</h3>
                  <p className="text-xs text-[#8b949e] mt-1">You've submitted your daily log for today. Great job!</p>
                </div>
              </div>
            )}
          </div>

          {/* Flagged mistakes banner */}
          {mistakes.filter(m => !m.resolved).length > 0 && (
            <div className="glass-card p-5 space-y-3.5 border-rose-200/40 dark:border-rose-400/15 animate-fade-up stagger-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-danger-soft" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-danger-soft">
                  Critical Flagged Mistakes ({mistakes.filter(m => !m.resolved).length})
                </h3>
              </div>
              <p className="text-xs text-[#f85149] leading-relaxed">
                Your tech lead has highlighted security leaks or coding errors. Address these ASAP in your next commits to secure full marks.
              </p>
              <div className="space-y-2">
                {mistakes.filter(m => !m.resolved).map(mistake => (
                  <div key={mistake.id} className="p-3 rounded-xl bg-[#161b22]/60 border border-[#f85149]/20 text-xs text-[#c9d1d9] space-y-1 shadow-sm">
                    <p className="font-bold text-[#f0f6fc]">{mistake.note}</p>
                    <p className="text-[10px] text-[#8b949e] font-mono">Flagged on: {formatDate(mistake.date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Timelines, Tasks, Feedback */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* My Tasks Board */}
          <div className="glass-card p-6 space-y-4 animate-fade-up stagger-3">
            <div>
              <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-1.5">
                Assigned Board <CheckSquare className="h-4.5 w-4.5 text-[#58a6ff]" />
              </h3>
              <p className="text-[11px] text-[#8b949e]">Advance task state by clicking standard action buttons.</p>
            </div>

            <div className="space-y-2.5">
              {tasks.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-[#30363d] p-6 space-y-2 bg-[#161b22]/40">
                  <div className="bg-[#30363d] p-2.5 rounded-full w-10 h-10 flex items-center justify-center mx-auto text-[#8b949e]">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#f0f6fc]">No tasks assigned yet. Enjoy the quiet! 🌟</p>
                    <p className="text-[11px] text-[#8b949e]">When your tech lead assigns tasks for the current sprint, they'll show up here.</p>
                  </div>
                </div>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id} 
                    className="p-4 rounded-xl bg-[#161b22]/60 border border-[#30363d] flex items-center justify-between gap-4 transition hover:shadow-lg btn-press"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-[#f0f6fc] leading-tight">{task.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          task.priority === 'high' 
                            ? 'bg-[#f85149]/10 text-[#f85149]' 
                            : 'bg-[#30363d] text-[#8b949e] border border-[#30363d]'
                        }`}>
                          {task.priority} priority
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-semibold capitalize ${
                          task.status === 'done' 
                            ? 'bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/20' 
                            : task.status === 'in_progress'
                            ? 'bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/20'
                            : 'bg-[#30363d] text-[#8b949e] border border-[#30363d]'
                        }`}>
                          {task.status === 'in_progress' ? 'In Progress' : task.status === 'done' ? 'Completed' : 'To Do'}
                        </span>
                      </div>
                      <p className="text-xs text-[#8b949e]">{task.description}</p>
                      <p className="text-[9px] text-[#8b949e] font-mono">Due: {formatDate(task.due_date)}</p>
                    </div>

                    <button
                      onClick={() => handleTaskStatusToggle(task.id, task.status)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 shrink-0 btn-press ${
                        task.status === 'done'
                          ? 'bg-[#3fb950]/10 text-[#3fb950] hover:bg-[#3fb950]/15 border border-[#3fb950]/20'
                          : task.status === 'in_progress'
                          ? 'bg-[#d29922]/10 text-[#d29922] hover:bg-[#d29922]/15 border border-[#d29922]/20'
                          : 'bg-[#30363d] text-[#8b949e] hover:bg-[#30363d]/80 border border-[#30363d]'
                      }`}
                    >
                      {task.status === 'done' ? (
                        <>
                          <Check className="h-3 w-3 stroke-[3]" /> Done
                        </>
                      ) : task.status === 'in_progress' ? (
                        <>
                          <Play className="h-3 w-3 fill-amber-600" /> Start
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-3 w-3" /> To Do
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Past Daily Logs Timeline */}
          <div className="glass-card p-6 space-y-4 animate-fade-up stagger-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc]">Past Logs History</h3>
                <p className="text-[11px] text-[#8b949e]">Explore and search past code journal records.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-[#30363d] bg-[#0d1117]/60 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] font-mono glass-input"
                  />
                </div>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#30363d] bg-[#0d1117]/60 text-xs text-[#c9d1d9] font-mono glass-input"
                />
              </div>
            </div>

            {/* Logs List Timeline */}
            <div className="space-y-4 pt-2">
              {logs.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-[#30363d] p-6 space-y-3 bg-[#161b22]/40">
                  <div className="bg-[#30363d] p-3 rounded-full w-11 h-11 flex items-center justify-center mx-auto text-[#8b949e]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#f0f6fc]">No logs yet — submit your first daily update!</p>
                    <p className="text-[11px] text-[#8b949e] max-w-sm mx-auto leading-relaxed">Use the code journal submission form on the left to describe your changes, select your tech stack, and share your progress.</p>
                  </div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#8b949e] italic">
                  No matching logs found. Clear filters to see all entries.
                </div>
              ) : (
                filteredLogs.map(log => {
                  const relativeMark = marks.find(m => m.related_log_id === log.id);
                  return (
                    <div key={log.id} className="relative pl-6 border-l-2 border-[#30363d] space-y-2">
                      {/* Timeline dot */}
                      <span className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-[#58a6ff] ring-4 ring-[#0d1117]" />
                      
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] text-[#8b949e] font-bold font-mono">{formatDate(log.date)}</span>
                          <h4 className="text-xs font-bold text-[#f0f6fc] mt-0.5">{log.summary}</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                          log.status === 'reviewed' 
                            ? 'bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/20' 
                            : 'bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/20'
                        }`}>
                          {log.status === 'reviewed' ? 'Reviewed' : 'Awaiting Review'}
                        </span>
                      </div>

                      <p className="text-xs text-[#c9d1d9] font-mono whitespace-pre-wrap bg-[#161b22]/60 p-2.5 rounded-xl leading-relaxed border border-[#30363d]">
                        {log.changes}
                      </p>

                      {/* Tech stack tags */}
                      {log.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {log.technologies.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded bg-[#30363d] text-[9px] text-[#8b949e] border border-[#30363d]">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Grade feedback */}
                      {relativeMark && (
                        <div className="p-3 bg-[#58a6ff]/6 rounded-xl border border-[#58a6ff]/15 space-y-1">
                          <p className="text-[9px] font-bold text-[#58a6ff] flex items-center gap-0.5 uppercase tracking-wide">
                            Graded {relativeMark.score}/5 <Award className="h-3 w-3 fill-[#58a6ff] text-[#58a6ff]" />
                          </p>
                          <p className="text-xs text-[#c9d1d9] italic">"{relativeMark.comment}"</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
