/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { Login } from './pages/auth/Login.js';
import { DashboardShell } from './components/layout/DashboardShell.js';
import { InternDashboard } from './pages/intern/InternDashboard.js';
import { MyProjects } from './pages/intern/MyProjects.js';
import { AskTeamThread } from './components/intern/AskTeamThread.js';
import { TeamOverview } from './pages/techlead/TeamOverview.js';
import { ManagerOverview } from './pages/manager/ManagerOverview.js';

import { AnimatePresence, motion } from 'motion/react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  // Set default active tab based on user's role upon login
  useEffect(() => {
    if (user) {
      if (user.role === 'intern') {
        setActiveTab('dashboard');
      } else if (user.role === 'tech_lead') {
        setActiveTab('team_overview');
      } else if (user.role === 'manager') {
        setActiveTab('analytics');
      }
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-[#8b949e]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#58a6ff] mb-3"></div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8b949e]">Loading InternTrack...</p>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!user) {
    return <Login />;
  }

  // Logged in -> Render shell with appropriate active tab panel
  return (
    <DashboardShell 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onRefresh={handleRefresh}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${user.id}-${activeTab}-${refreshKey}`}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
        >
          {/* INTERN VIEWS */}
          {user.role === 'intern' && (
            <>
              {activeTab === 'dashboard' && <InternDashboard user={user} onRefreshStats={handleRefresh} />}
              {activeTab === 'projects' && <MyProjects currentUser={user} />}
              {activeTab === 'discussions' && <AskTeamThread currentUser={user} />}
            </>
          )}

          {/* TECH LEAD VIEWS */}
          {user.role === 'tech_lead' && (
            <>
              {activeTab === 'team_overview' && <TeamOverview currentUser={user} />}
              {activeTab === 'discussions' && <AskTeamThread currentUser={user} />}
            </>
          )}

          {/* MANAGER VIEWS */}
          {user.role === 'manager' && (
            <>
              {activeTab === 'analytics' && <ManagerOverview currentUser={user} />}
              {activeTab === 'all_projects' && <MyProjects currentUser={user} readOnly={true} />}
              {activeTab === 'discussions' && <AskTeamThread currentUser={user} />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </DashboardShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
