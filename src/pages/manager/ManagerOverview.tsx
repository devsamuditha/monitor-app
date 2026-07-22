/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api.js';
import { User, Project } from '../../types.js';
import { InternDetail } from '../../components/techlead/InternDetail.js';
import { getSupabaseClient } from '../../lib/supabaseClient.js';
import { 
  TrendingUp, Award, Clock, Users, Building, 
  ExternalLink, ArrowRight, ChevronRight, Star, Calendar, FolderHeart
} from 'lucide-react';
import { formatDate } from '../../utils/helpers.js';

interface ManagerOverviewProps {
  currentUser: User;
}

export const ManagerOverview: React.FC<ManagerOverviewProps> = ({ currentUser }) => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [techLeads, setTechLeads] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [drilldownInternId, setDrilldownInternId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [allStats, users] = await Promise.all([
        api.getAnalytics(), // Load global analytics
        api.getUsers()
      ]);
      setAnalytics(allStats);
      setTechLeads(users.filter(u => u.role === 'tech_lead'));
    } catch (e) {
      console.error(e);
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
          .channel('manager-oversight')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'User' },
            () => {
              loadData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DailyLog' },
            () => {
              loadData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Task' },
            () => {
              loadData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in ManagerOverview:", err);
      }
    };

    setupRealtime();

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    };
  }, [drilldownInternId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#58a6ff] mx-auto mb-4"></div>
        <p className="text-sm text-[#8b949e]">Retrieving executive telemetry...</p>
      </div>
    );
  }

  if (drilldownInternId) {
    return (
      <InternDetail 
        internId={drilldownInternId} 
        currentUser={currentUser} 
        readOnly={true}
        onBack={() => setDrilldownInternId(null)} 
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
    marksTrend = [],
    mostUsedTechs = []
  } = analytics || {};

  return (
    <div id="manager-dashboard-root" className="space-y-6 relative">
      {/* Ambient background */}
      <div className="ambient-bg">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      
      {/* Executive Header Banner */}
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-up">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161b22]/60 border border-[#30363d] text-xs font-bold text-[#a371f7]">
            <Building className="h-3.5 w-3.5 text-[#a371f7]" /> Company-wide Engineering Oversight
          </div>
          <h2 className="text-2xl font-black text-[#f0f6fc] tracking-tight">Executive Control Desk</h2>
          <p className="text-xs text-[#8b949e] max-w-xl">
            A centralized dashboard detailing software engineering intern check-in compliance, performance marks trends, and technical stack distributions across all teams.
          </p>
        </div>

        {/* Global Organization Stats badges */}
        <div className="flex flex-wrap gap-3">
          <div className="p-3 bg-[#58a6ff]/8 border border-[#58a6ff]/30 rounded-2xl text-center min-w-[100px]">
            <p className="text-[18px] font-black text-[#58a6ff]">{complianceRate}%</p>
            <p className="text-[8px] uppercase font-bold text-[#58a6ff] mt-0.5">Org Compliance</p>
          </div>
          <div className="p-3 bg-[#3fb950]/8 border border-[#3fb950]/30 rounded-2xl text-center min-w-[100px]">
            <p className="text-[18px] font-black text-[#3fb950]">{avgMarks} ⭐</p>
            <p className="text-[8px] uppercase font-bold text-[#3fb950] mt-0.5">Average Score</p>
          </div>
        </div>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center gap-4 animate-fade-up stagger-1">
          <div className="bg-[#a371f7]/10 text-[#a371f7] p-3 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e] font-bold uppercase">Tech Mentors</p>
            <p className="text-lg font-black text-[#f0f6fc] mt-0.5">{techLeads.length} Active</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4 animate-fade-up stagger-2">
          <div className="bg-[#58a6ff]/10 text-[#58a6ff] p-3 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e] font-bold uppercase">Intern Headcount</p>
            <p className="text-lg font-black text-[#f0f6fc] mt-0.5">{rosterData.length} Total</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4 animate-fade-up stagger-3">
          <div className="bg-[#3fb950]/10 text-[#3fb950] p-3 rounded-xl">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3fb950] inline-block animate-pulse shrink-0" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e] font-bold uppercase">Presence Now</p>
            <p className="text-lg font-black text-[#3fb950] mt-0.5">{activeCount} Coding</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4 animate-fade-up stagger-4">
          <div className="bg-[#58a6ff]/10 text-[#58a6ff] p-3 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e] font-bold uppercase">Journal Entries</p>
            <p className="text-lg font-black text-[#f0f6fc] mt-0.5">{totalLogs} Submits</p>
          </div>
        </div>
      </div>

      {/* Charts & Trends Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Compliance Rate Timeline SVG Line Chart */}
        <div className="glass-card p-6 space-y-4 animate-fade-up">
          <div>
            <h3 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest flex items-center gap-1">
              Check-In Submissions Volume (Last 7 Days) <TrendingUp className="h-4.5 w-4.5 text-[#58a6ff]" />
            </h3>
          </div>

          <div className="h-44 pt-4 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#58a6ff" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(48, 54, 61, 0.5)" strokeWidth="0.5" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(48, 54, 61, 0.5)" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(48, 54, 61, 0.5)" strokeWidth="0.5" />
              
              <path 
                d={submissionTrend.length > 0 
                  ? `M 0,${40 - (submissionTrend[0].count * 8)} 
                     C 20,${40 - (submissionTrend[1]?.count * 8 || 15)} 40,${40 - (submissionTrend[2]?.count * 8 || 10)} 50,${40 - (submissionTrend[3]?.count * 8 || 20)} 
                     C 60,${40 - (submissionTrend[4]?.count * 8 || 15)} 80,${40 - (submissionTrend[5]?.count * 8 || 30)} 100,${40 - (submissionTrend[6]?.count * 8 || 25)}`
                  : "M 0,30 L 100,30"}
                fill="url(#chart-grad)"
                stroke="#58a6ff"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {submissionTrend.map((t: any, idx: number) => {
                const xVal = idx * (100 / (submissionTrend.length - 1 || 1));
                const yVal = 40 - (t.count * 8);
                return (
                  <circle 
                    key={idx}
                    cx={xVal} 
                    cy={yVal} 
                    r="1.8" 
                    fill="#0d1117" 
                    stroke="#58a6ff" 
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>

            <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 text-[8px] text-[#8b949e] font-mono">
              {submissionTrend.map((d: any, idx: number) => (
                <span key={idx}>{d.date.substring(8, 10)}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Score Trend SVG Chart */}
        <div className="glass-card p-6 space-y-4 animate-fade-up stagger-1">
          <div>
            <h3 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest flex items-center gap-1">
              Average Grade Score Progression (7 Days) <Award className="h-4.5 w-4.5 text-[#3fb950]" />
            </h3>
          </div>

          <div className="h-44 pt-4 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
              <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(48, 54, 61, 0.5)" strokeWidth="0.5" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(48, 54, 61, 0.5)" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(48, 54, 61, 0.5)" strokeWidth="0.5" />
              
              <path 
                d={marksTrend.length > 0
                  ? `M 0,${40 - (marksTrend[0].score * 7)} 
                     C 25,${40 - (marksTrend[2]?.score * 7 || 25)} 50,${40 - (marksTrend[4]?.score * 7 || 20)} 100,${40 - (marksTrend[6]?.score * 7 || 30)}`
                  : "M 0,15 L 100,15"}
                fill="none"
                stroke="#3fb950"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {marksTrend.map((t: any, idx: number) => {
                const xVal = idx * (100 / (marksTrend.length - 1 || 1));
                const yVal = 40 - (t.score * 7);
                return (
                  <circle 
                    key={idx}
                    cx={xVal} 
                    cy={yVal} 
                    r="1.8" 
                    fill="#0d1117" 
                    stroke="#3fb950" 
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>

            <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 text-[8px] text-[#8b949e] font-mono">
              {marksTrend.map((d: any, idx: number) => (
                <span key={idx}>{d.date.substring(8, 10)}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Directory & Oversight Roster */}
      <div className="glass-table p-6 space-y-4 animate-fade-up">
        <div>
          <h3 className="text-sm font-bold text-[#f0f6fc]">Active Corporate Directory</h3>
          <p className="text-xs text-[#8b949e]">Drill down and click on any row to inspect an intern's daily log commits, assigned boards, or direct comments as an executive overseer.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#30363d] text-[10px] uppercase font-bold text-[#8b949e] tracking-wider">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Reporting Status</th>
                <th className="pb-3">Assigned Tech Lead</th>
                <th className="pb-3">Average Mark</th>
                <th className="pb-3 text-right">Sprint Score</th>
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
                      <p className="text-sm font-bold text-[#f0f6fc]">No active interns yet 👥</p>
                      <p className="text-xs text-[#8b949e] max-w-md mx-auto leading-relaxed">
                        No interns registered in the system yet. Once interns register under their respective engineering teams, their corporate profiles and metric curves will be fully tracked here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rosterData.map((row: any) => {
                  const findLead = techLeads.find(tl => tl.id === (row.intern.assigned_tech_lead_id || 'tl-alex'));
                  return (
                    <tr 
                      key={row.intern.id}
                      onClick={() => setDrilldownInternId(row.intern.id)}
                      className="group hover:bg-[#58a6ff]/[0.03] cursor-pointer transition duration-150"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-3">
                          <img src={row.intern.avatar} alt={row.intern.name} className="h-8 w-8 rounded-full object-cover border border-[#30363d]" referrerPolicy="no-referrer" />
                          <div>
                            <p className="text-xs font-bold text-[#f0f6fc] truncate group-hover:text-[#58a6ff]">{row.intern.name}</p>
                            <p className="text-[10px] text-[#8b949e] truncate">{row.intern.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status check mark */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${row.intern.active ? 'bg-[#3fb950] animate-pulse' : 'bg-[#30363d]'}`} />
                          <span className="text-[11px] text-[#8b949e]">
                            {row.intern.active ? 'Active Now' : 'Offline'}
                          </span>
                        </div>
                      </td>

                      {/* Assigned Tech Lead */}
                      <td className="py-3 px-2">
                        <p className="text-xs font-bold text-[#c9d1d9]">
                          {findLead ? findLead.name : 'Unassigned'}
                        </p>
                        <p className="text-[10px] text-[#8b949e]">Engineering Lead</p>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1 text-[#58a6ff] font-bold text-xs">
                          {row.avgMark} <Star className="h-3.5 w-3.5 fill-[#58a6ff] text-[#58a6ff]" />
                        </div>
                      </td>

                      {/* Quick drilldown */}
                      <td className="py-3 pl-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs font-bold text-[#f0f6fc]">
                              {row.completedTasks} / {row.totalTasks} Tasks
                            </p>
                            <p className="text-[9px] text-[#f85149]">
                              {row.unresolvedMistakesCount > 0 ? `${row.unresolvedMistakesCount} unresolved blunders` : 'Codebase Safe'}
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
    </div>
  );
};
