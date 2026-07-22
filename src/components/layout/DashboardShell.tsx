/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { 
  LayoutDashboard, FolderKanban, MessageSquare, Sun, Moon, 
  LogOut, Power, Target, Users, TrendingUp
} from 'lucide-react';
import { api } from '../../services/api.js';

interface DashboardShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh?: () => void;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ 
  children, 
  activeTab, 
  setActiveTab,
  onRefresh
}) => {
  const { user, logout, refreshCurrentUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  if (!user) return <>{children}</>;

  const handleStatusToggle = async () => {
    try {
      const nextActive = !user.active;
      await api.toggleUserStatus(user.id, nextActive);
      await refreshCurrentUser();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const getNavItems = () => {
    switch (user.role) {
      case 'intern':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'projects', label: 'My Projects', icon: FolderKanban },
          { id: 'discussions', label: 'Ask the Team', icon: MessageSquare },
        ];
      case 'tech_lead':
        return [
          { id: 'team_overview', label: 'Team Overview', icon: Users },
          { id: 'discussions', label: 'Ask the Team', icon: MessageSquare },
        ];
      case 'manager':
        return [
          { id: 'analytics', label: 'Org Analytics', icon: TrendingUp },
          { id: 'all_projects', label: 'Projects Registry', icon: FolderKanban },
          { id: 'discussions', label: 'Ask the Team', icon: MessageSquare },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex transition-colors duration-200 relative">
      {/* Ambient background */}
      <div className="ambient-bg">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
        <div className="ambient-blob ambient-blob-4" />
      </div>
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-sidebar shrink-0 z-10">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-[#30363d] gap-2.5">
          <div className="bg-[#238636] text-white p-2 rounded-xl">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-[#f0f6fc] uppercase">InternTrack</h1>
            <p className="text-[9px] text-[#58a6ff] font-bold uppercase tracking-wider font-mono">Software Engineering</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-pill w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 btn-press ${
                  active
                    ? 'active font-bold text-[#58a6ff]'
                    : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-white/5'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${active ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Row */}
        <div className="p-4 border-t border-[#30363d] space-y-2">
          <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[#30363d] bg-[#161b22]/60">
            <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover border border-[#30363d]" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-[#f0f6fc]">{user.name}</p>
              <p className="text-[9px] text-[#8b949e] capitalize truncate">{user.role}</p>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 hover:bg-white/10 text-[#8b949e] hover:text-[#f85149] rounded-lg transition btn-press"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar */}
        <header className="h-20 glass-topbar flex items-center justify-between px-8 z-10">
          
          {/* Left indicator / Mobile Title */}
          <div className="flex items-center gap-2">
            <span className="md:hidden bg-[#238636] text-white p-1 rounded-md shrink-0">
              <Target className="h-4 w-4" />
            </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#f0f6fc] md:inline-block hidden">Active Dashboard:</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#58a6ff]/30 bg-[#58a6ff]/8 text-[#58a6ff]">
                  {user.role === 'tech_lead' ? 'Tech Lead Reviewer' : user.role === 'manager' ? 'Executive Manager' : 'Software Intern'}
                </span>
              </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            
            {/* Intern active/inactive toggle */}
            {user.role === 'intern' && (
              <button 
                onClick={handleStatusToggle}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition flex items-center gap-1.5 btn-press ${
                  user.active 
                    ? 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30' 
                    : 'bg-white/5 text-[#8b949e] border-[#30363d]'
                }`}
              >
                <Power className="h-3 w-3" />
                {user.active ? "Status: Working Now 🔥" : "Status: Away / Inactive"}
              </button>
            )}

            {/* Dark Mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 border border-[#30363d] rounded-xl text-[#8b949e] hover:bg-white/5 transition btn-press"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <img 
              src={user.avatar} 
              alt={user.name} 
              className="h-8 w-8 rounded-full object-cover border border-[#30363d] md:hidden" 
              onClick={logout}
              title="Logout"
              referrerPolicy="no-referrer"
            />
          </div>
        </header>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex glass-topbar border-b border-[#30363d] px-4 py-2 justify-around gap-1 shrink-0 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-pill flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[9px] font-semibold transition btn-press ${
                  active 
                    ? 'active font-bold text-[#58a6ff]' 
                    : 'text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
