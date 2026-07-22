/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api.js';
import { User, TeamStats } from '../../types.js';
import { InternDetail } from '../../components/techlead/InternDetail.js';
import { getSupabaseClient } from '../../lib/supabaseClient.js';
import { 
  Users, CheckCircle, Clock, Star, Flame, AlertTriangle, 
  TrendingUp, Sparkles, ChevronRight, Check, X, ShieldCheck 
} from 'lucide-react';
import { formatDate } from '../../utils/helpers.js';

interface TeamOverviewProps {
  currentUser: User;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({ currentUser }) => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      const stats = await api.getAnalytics(currentUser.id);
      setAnalytics(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    let subscriptionChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        subscriptionChannel = supabase
          .channel('techlead-team-overview')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'User' },
            () => {
              loadAnalytics();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DailyLog' },
            () => {
              loadAnalytics();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Task' },
            () => {
              loadAnalytics();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in TeamOverview:", err);
      }
    };

    setupRealtime();

    // Fallback polling for robust dashboard updates across tabs
    const pollInterval = setInterval(() => {
      loadAnalytics();
    }, 5000);

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
      clearInterval(pollInterval);
    };
  }, [currentUser, selectedInternId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#58a6ff] mx-auto mb-4"></div>
        <p className="text-sm text-[#8b949e]">Retrieving team rosters...</p>
      </div>
    );
  }

  if (selectedInternId) {
    return (
      <InternDetail 
        internId={selectedInternId} 
        currentUser={currentUser} 
        onBack={() => setSelectedInternId(null)} 
      />
    );
  }

  const {
    complianceRate = 0,
    avgMarks = 0,
    totalLogs = 0,
    activeCount = 0,
    rosterData = [],
    submissionTrend = [],
    mostUsedTechs = [],
    recentLogs = []
  } = analytics || {};

  const activeLogs = recentLogs.filter((l: any) => l.status === 'started');
  const completedLogs = recentLogs.filter((l: any) => l.status !== 'started');

  return (
    <div id="techlead-overview-root" className="space-y-6 relative">
      {/* Ambient background */}
      <div className="ambient-bg">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      
      {/* Welcome Banner */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden animate-fade-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#58a6ff]/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161b22]/60 border border-[#30363d] text-xs font-semibold text-[#3fb950]">
              <ShieldCheck className="h-4 w-4 text-[#3fb950]" /> Authorized Tech Lead Reviewer
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight mt-2 text-[#f0f6fc]">Hello, {currentUser.name}! 👋</h2>
            <p className="text-xs text-[#8b949e] max-w-md">
              Review and score daily learning journals, assign target sprint tasks, flag security concerns, and mentor your software engineering interns.
            </p>
          </div>
          
          <div className="bg-[#161b22]/60 border border-[#30363d] p-4 rounded-2xl flex items-center gap-4">
            <p className="text-xs font-semibold text-[#c9d1d9]">Today's Check-in compliance</p>
            <div className="relative h-14 w-14 shrink-0 flex items-center justify-center font-bold text-sm bg-[#58a6ff]/10 rounded-full border border-[#58a6ff]/30 text-[#58a6ff]">
              {complianceRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 animate-fade-up stagger-1">
          <p className="text-[10px] text-[#8b949e] font-bold uppercase tracking-wide">Roster Interns</p>
          <p className="text-lg font-black text-[#f0f6fc] mt-1">{rosterData.length} assigned</p>
        </div>
        <div className="glass-card p-4 animate-fade-up stagger-2">
          <p className="text-[10px] text-[#8b949e] font-bold uppercase tracking-wide">Working Now</p>
          <p className="text-lg font-black text-[#3fb950] mt-1">{activeCount} online</p>
        </div>
        <div className="glass-card p-4 animate-fade-up stagger-3">
          <p className="text-[10px] text-[#8b949e] font-bold uppercase tracking-wide">Average Score</p>
          <p className="text-lg font-black text-[#58a6ff] mt-1 flex items-center gap-1">
            {avgMarks} <Star className="h-4 w-4 fill-[#58a6ff] text-[#58a6ff]" />
          </p>
        </div>
        <div className="glass-card p-4 animate-fade-up stagger-4">
          <p className="text-[10px] text-[#8b949e] font-bold uppercase tracking-wide">Total Submissions</p>
          <p className="text-lg font-black text-[#f0f6fc] mt-1">{totalLogs} logged</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Roster Table */}
        <div className="lg:col-span-8 glass-table p-6 space-y-4 animate-fade-up stagger-3">
          <div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Intern Roster</h3>
            <p className="text-xs text-[#8b949e]">Click into an intern card to review journal commits, award marks, or leave mentors feedback.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#30363d] text-[10px] uppercase font-bold text-[#8b949e] tracking-wider">
                  <th className="pb-3 font-semibold">Intern name</th>
                  <th className="pb-3 font-semibold">Current State</th>
                  <th className="pb-3 font-semibold">Log Streak</th>
                  <th className="pb-3 font-semibold">Average Stars</th>
                  <th className="pb-3 font-semibold text-right">Sprint Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]">
                {rosterData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center space-y-3">
                      <div className="bg-[#30363d] p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-[#8b949e]">
                        <Users className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#f0f6fc]">No interns assigned yet 👥</p>
                        <p className="text-xs text-[#8b949e] max-w-md mx-auto leading-relaxed">
                          No interns yet — invite your team to get started! Once interns register and log entries, their profiles and sprint telemetry will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rosterData.map((row: any) => {
                    const hasSubmittedToday = row.lastSubmission === formatDate(new Date().toISOString().split('T')[0]);
                    return (
                      <tr 
                        key={row.intern.id}
                        onClick={() => setSelectedInternId(row.intern.id)}
                        className="group hover:bg-[#58a6ff]/[0.03] cursor-pointer transition duration-150"
                      >
                        {/* Name & Avatar */}
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center gap-3">
                            <img src={row.intern.avatar} alt={row.intern.name} className="h-8 w-8 rounded-full object-cover border border-[#30363d]" referrerPolicy="no-referrer" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#f0f6fc] truncate group-hover:text-[#58a6ff]">{row.intern.name}</p>
                              <p className="text-[10px] text-[#8b949e] truncate">{row.intern.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${row.intern.active ? 'bg-[#3fb950] animate-pulse' : 'bg-[#30363d]'}`} />
                            <span className="text-[11px] text-[#8b949e]">
                              {row.intern.active ? 'Working Now' : 'Offline'}
                            </span>
                          </div>
                        </td>

                        {/* Streak */}
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1">
                            <Flame className={`h-4 w-4 ${row.streak > 0 ? 'text-[#d29922] fill-[#d29922]' : 'text-[#30363d]'}`} />
                            <span className="text-xs font-bold text-[#f0f6fc]">{row.streak} days</span>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1 text-[#58a6ff] font-bold text-xs">
                            {row.avgMark} <Star className="h-3.5 w-3.5 fill-[#58a6ff] text-[#58a6ff]" />
                          </div>
                        </td>

                        {/* Task score compliance */}
                        <td className="py-3.5 pl-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-[#f0f6fc]">
                                {row.completedTasks} / {row.totalTasks} Done
                              </p>
                              <p className="text-[9px] text-[#8b949e]">
                                {row.unresolvedMistakesCount > 0 
                                  ? `${row.unresolvedMistakesCount} blunders flagged` 
                                  : 'All clean'}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#30363d] group-hover:text-[#58a6ff] transition" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* High level team trends */}
        <div className="lg:col-span-4 space-y-6">
          {/* Custom SVG Bar Chart */}
          <div className="glass-card p-6 space-y-3.5 animate-fade-up stagger-4">
            <div>
              <h3 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest flex items-center gap-1">
                Submissions (Last 7 Days) <TrendingUp className="h-4 w-4 text-[#58a6ff]" />
              </h3>
            </div>

            <div className="h-32 flex items-end justify-between pt-4 border-b pb-1 border-[#30363d]">
              {submissionTrend.map((t: any, idx: number) => {
                const maxCount = Math.max(...submissionTrend.map((d: any) => d.count), 1);
                const pct = (t.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group relative">
                    <div className="absolute bottom-full mb-1 bg-[#0d1117] text-[#c9d1d9] text-[9px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 border border-[#30363d]">
                      {t.count} logs
                    </div>
                    <div 
                      className="w-4 bg-[#58a6ff] hover:bg-[#58a6ff]/80 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(pct, 10)}%` }}
                    />
                    <span className="text-[8px] text-[#8b949e] mt-1 truncate max-w-[36px] font-mono">
                      {t.date.substring(8, 10)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[#8b949e] text-center">Dates mapped relative to sprint timeline.</p>
          </div>

          {/* Tech Tag distribution */}
          <div className="glass-card p-6 space-y-4 animate-fade-up stagger-5">
            <div>
              <h3 className="text-sm font-bold text-[#f0f6fc]">Trending Technologies</h3>
              <p className="text-[11px] text-[#8b949e]">Stack distribution across submitted intern journals.</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {mostUsedTechs.length === 0 ? (
                <p className="text-xs text-[#8b949e] italic">No logs parsed for tech stacks yet.</p>
              ) : (
                mostUsedTechs.map((tech: any) => (
                  <span 
                    key={tech.name} 
                    className="px-2.5 py-1 rounded-xl bg-[#30363d] text-[#c9d1d9] flex items-center gap-1.5 font-medium"
                  >
                    <span>{tech.name}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#58a6ff]/10 text-[10px] text-[#58a6ff] font-bold">
                      {tech.count}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Currently Working / Morning Check-ins */}
      <div className="glass-card p-6 space-y-4 animate-fade-up stagger-5 relative z-10 mt-6 border border-[#58a6ff]/20">
        <div>
          <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
            Currently Working <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#3fb950]"></span></span>
          </h3>
          <p className="text-[11px] text-[#8b949e]">Interns who have started their day.</p>
        </div>
        
        <div className="space-y-3">
          {activeLogs.length === 0 ? (
            <p className="text-xs text-[#8b949e] italic">No active morning check-ins right now.</p>
          ) : (
            activeLogs.map((log: any) => (
              <div 
                key={log.id} 
                className="p-4 rounded-xl bg-[#58a6ff]/5 border border-[#58a6ff]/20 flex gap-4 transition hover:border-[#58a6ff]/50 cursor-pointer group btn-press" 
                onClick={() => setSelectedInternId(log.intern_id)}
              >
                <img src={log.intern_avatar} alt={log.intern_name} className="h-10 w-10 rounded-full border border-[#30363d] object-cover shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] transition">{log.intern_name}</p>
                      <p className="text-[10px] text-[#8b949e] font-mono">Started: {log.start_time ? new Date(log.start_time).toLocaleTimeString() : 'Unknown'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/20">
                      Working
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider mb-1">Today's Plan</h4>
                    <p className="text-sm font-medium text-[#c9d1d9] leading-relaxed">{log.planned_tasks}</p>
                  </div>
                  {log.morning_question && (
                    <div className="bg-[#d29922]/10 border border-[#d29922]/20 p-2.5 rounded-lg mt-2">
                      <h4 className="text-[10px] font-bold text-[#d29922] uppercase tracking-wider mb-0.5">Morning Question</h4>
                      <p className="text-xs text-[#f0f6fc] italic">{log.morning_question}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Completed Logs Feed */}
      <div className="glass-card p-6 space-y-4 animate-fade-up stagger-6 relative z-10 mt-6">
        <div>
          <h3 className="text-sm font-bold text-[#f0f6fc]">Recent Submissions</h3>
          <p className="text-[11px] text-[#8b949e]">End of day logs submitted by your team.</p>
        </div>
        
        <div className="space-y-3">
          {completedLogs.length === 0 ? (
            <p className="text-xs text-[#8b949e] italic">No logs submitted yet.</p>
          ) : (
            completedLogs.map((log: any) => (
              <div 
                key={log.id} 
                className="p-4 rounded-xl bg-[#161b22]/80 border border-[#30363d] flex gap-4 transition hover:border-[#58a6ff]/30 cursor-pointer group btn-press" 
                onClick={() => setSelectedInternId(log.intern_id)}
              >
                <img src={log.intern_avatar} alt={log.intern_name} className="h-10 w-10 rounded-full border border-[#30363d] object-cover shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] transition">{log.intern_name}</p>
                      <p className="text-[10px] text-[#8b949e] font-mono">{formatDate(log.date)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                      log.status === 'reviewed' 
                        ? 'bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/20' 
                        : 'bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/20'
                    }`}>
                      {log.status === 'reviewed' ? 'Reviewed' : 'Needs Review'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#f0f6fc] mt-1 truncate">{log.summary}</h4>
                  
                  {log.site_url && (
                    <a href={log.site_url} target="_blank" rel="noreferrer" className="inline-block mt-1 text-[10px] text-[#58a6ff] hover:underline" onClick={(e) => e.stopPropagation()}>
                      🌍 {log.site_url}
                    </a>
                  )}

                  <p className="text-xs text-[#c9d1d9] font-mono whitespace-pre-wrap bg-[#0d1117]/60 p-2.5 rounded-lg border border-[#30363d] mt-2 line-clamp-2">
                    {log.changes}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
