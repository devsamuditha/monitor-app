import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { api } from '../../services/api.js';
import { User, Project } from '../../types.js';
import { Sparkles, Check, Sunrise } from 'lucide-react';

interface StartDayFormProps {
  user: User;
  onSuccess: () => void;
}

export const StartDayForm: React.FC<StartDayFormProps> = ({ user, onSuccess }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [plannedTasks, setPlannedTasks] = useState('');
  const [morningQuestion, setMorningQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const pList = await api.getProjects();
        setProjects(pList);
        if (pList.length > 0) {
          const own = pList.find(p => p.owner_id === user.id);
          setSelectedProjectId(own ? own.id : pList[0].id);
        }
      } catch (err) {
        console.error("Error loading projects", err);
      }
    };
    fetchProjects();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a project.');
      return;
    }
    if (!plannedTasks.trim()) {
      setError('Please describe what you plan to do today.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.startDay({
        intern_id: user.id,
        project_id: selectedProjectId,
        planned_tasks: plannedTasks.trim(),
        morning_question: morningQuestion.trim() || undefined,
      });

      setShowSuccessAnim(true);
      setTimeout(() => {
        setShowSuccessAnim(false);
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to start the day.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden transition-all duration-200">
      <AnimatePresence>
        {showSuccessAnim && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#238636]/90 backdrop-blur-sm flex flex-col items-center justify-center z-30 text-white p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
               className="bg-white text-[#0d1117] rounded-full p-4 mb-4 shadow-lg"
            >
              <Check className="h-10 w-10 stroke-[3]" />
            </motion.div>
            <motion.h3 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold tracking-tight mb-2"
            >
              Day Started! 🌅
            </motion.h3>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-indigo-100 max-w-sm text-sm"
            >
              Your tech lead has been notified. Let's get to work!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[#f0f6fc] flex items-center gap-2">
            Start Day Check-in <Sunrise className="h-4 w-4 text-[#d29922]" />
          </h2>
          <p className="text-xs text-[#8b949e]">Let your Tech Lead know what you're working on today.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-xs animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Selector */}
        <div>
          <label className="block text-xs font-medium text-[#8b949e] mb-1">Working Project</label>
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 glass-input"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* What to do today */}
        <div>
          <label className="block text-xs font-medium text-[#8b949e] mb-1">What do you plan to do today?</label>
          <textarea
            rows={3}
            placeholder="e.g. Implement the user profile settings and fix the navigation bug."
            value={plannedTasks}
            onChange={(e) => setPlannedTasks(e.target.value)}
            className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 text-xs glass-input"
          />
        </div>

        {/* Any questions */}
        <div>
          <label className="block text-xs font-medium text-[#8b949e] mb-1">Any questions about this project? (Optional)</label>
          <textarea
            rows={2}
            placeholder="e.g. How should I handle the validation errors for the email field?"
            value={morningQuestion}
            onChange={(e) => setMorningQuestion(e.target.value)}
            className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 text-xs glass-input"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-white font-medium bg-[#58a6ff] hover:bg-[#318bfb] active:scale-[0.98] transition-all duration-150 text-sm flex items-center justify-center gap-2 disabled:opacity-50 btn-press"
        >
          {loading ? 'Starting...' : 'Start Day 🚀'}
        </button>
      </form>
    </div>
  );
};
