/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

import { motion, AnimatePresence } from 'motion/react';
import { Target, Sparkles, ArrowRight, User as UserIcon, Mail, Lock, Landmark, ChevronDown } from 'lucide-react';

export const Login: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'login' | 'register_intern' | 'register_tech_lead'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedTechLeadId, setSelectedTechLeadId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [techLeads, setTechLeads] = useState<any[]>([]);

  const { login, signUp } = useAuth();

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await api.getPublicTechLeads();
        setTechLeads(data);
      } catch (err) {
        console.warn("Could not fetch active tech leads:", err);
      }
    };
    fetchLeads();
  }, [activeMode]);

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await login(email.trim(), password);
      setSuccess('Redirecting to your dashboard...');
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid corporate email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signUp({
        email: email.trim(),
        password,
        name: fullName.trim(),
        role: 'intern',
        techLeadId: selectedTechLeadId || null
      });
      setSuccess('Student account created! Logging in...');
    } catch (err: any) {
      setError(err.message || 'Registration failed. This email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTechLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid corporate email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signUp({
        email: email.trim(),
        password,
        name: fullName.trim(),
        role: 'tech_lead'
      });
      setSuccess('Tech Lead account created! Logging in...');
    } catch (err: any) {
      setError(err.message || 'Registration failed. This email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const resetFormState = (mode: 'login' | 'register_intern' | 'register_tech_lead') => {
    setActiveMode(mode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setSelectedTechLeadId('');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col md:flex-row transition-colors duration-200 relative overflow-hidden">
      {/* Ambient background */}
      <div className="ambient-bg">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
        <div className="ambient-blob ambient-blob-4" />
      </div>

      {/* Brand & Narrative Side */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#161b22] via-[#0d1117] to-[#161b22] p-8 md:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden border-r border-[#30363d]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#58a6ff]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#58a6ff]/5 rounded-full blur-3xl -ml-30 -mb-30 pointer-events-none" />
   
        {/* Logo */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="bg-[#58a6ff] text-white p-2 rounded-xl">
            <Target className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase text-[#f0f6fc]">InternTrack</h1>
            <p className="text-[10px] text-[#8b949e] font-bold uppercase tracking-wider">Software Engineering</p>
          </div>
        </div>

        {/* Motivation Card */}
        <div className="my-12 md:my-auto max-w-md z-10 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/20 text-xs font-semibold text-[#58a6ff]"
          >
            <Sparkles className="h-4 w-4 text-[#d29922] fill-[#d29922]" /> Encouraging Daily Learning
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-[#f0f6fc]"
          >
            Not another boring corporate tracker.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-[#8b949e] leading-relaxed"
          >
            A warm, encouraging daily journal designed for tech interns, leads, and managers. Track streaks, capture achievements, review codes gracefully, and learn from mistakes together.
          </motion.p>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 pt-4 border-t border-[#30363d]"
          >
            <div>
              <p className="text-xl font-extrabold text-[#f0f6fc]">5-Day 🔥</p>
              <p className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">Average Streak</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#f0f6fc]">100%</p>
              <p className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">Transparency</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#f0f6fc]">0% 📄</p>
              <p className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">Paperwork noise</p>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-[#8b949e]/80 z-10">
          Made with care for growing engineering teams. &copy; {new Date().getFullYear()} InternTrack
        </div>
      </div>

      {/* Forms & Quick Login Side */}
      <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center transition-colors duration-200 relative">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Access InternTrack</h3>
            <p className="text-xs text-[#8b949e] mt-1.5">
              Choose your operation mode below to connect with your sprint telemetry workspace.
            </p>
          </div>

          {/* Landing / Auth tabs */}
          <div className="flex border-b border-[#30363d]">
            <button
              onClick={() => resetFormState('login')}
              className={`flex-1 pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition ${
                activeMode === 'login'
                  ? 'border-[#58a6ff] text-[#58a6ff]'
                  : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => resetFormState('register_intern')}
              className={`flex-1 pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition ${
                activeMode === 'register_intern'
                  ? 'border-[#58a6ff] text-[#58a6ff]'
                  : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              Student Sign Up
            </button>
            <button
              onClick={() => resetFormState('register_tech_lead')}
              className={`flex-1 pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition ${
                activeMode === 'register_tech_lead'
                  ? 'border-[#58a6ff] text-[#58a6ff]'
                  : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              Lead Sign Up
            </button>
          </div>

          {error && (
            <div className="p-3 bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-xs font-medium rounded-xl animate-fade-in">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-[#3fb950]/10 border border-[#3fb950]/30 text-[#3fb950] text-xs font-medium rounded-xl animate-fade-in">
              {success}
            </div>
          )}

          {/* Forms switcher */}
          <AnimatePresence mode="wait">
            {activeMode === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleLogin} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#8b949e]" />
                    <input
                      type="email"
                      placeholder="e.g. sam@intern.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-4 py-2.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8b949e]" />
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-4 py-2.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] active:scale-[0.98] transition text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 btn-press"
                >
                  {loading ? 'Authenticating...' : 'Log In to Dashboard'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.form>
            )}

            {activeMode === 'register_intern' && (
              <motion.form 
                key="register_intern"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleRegisterIntern} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-[#8b949e]" />
                    <input
                      type="text"
                      placeholder="e.g. Sam Chen"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-4 py-2.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#8b949e]" />
                    <input
                      type="email"
                      placeholder="e.g. sam_new@intern.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-4 py-2.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8b949e]" />
                      <input
                        type="password"
                        placeholder="At least 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-4 py-2.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8b949e]" />
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-4 py-2.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                    Assign to Tech Lead (Optional)
                  </label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-3.5 h-4 w-4 text-[#8b949e] pointer-events-none" />
                    <select
                      value={selectedTechLeadId}
                      onChange={(e) => setSelectedTechLeadId(e.target.value)}
                      className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-10 py-2.5 text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 appearance-none transition-all duration-200 cursor-pointer"
                      disabled={loading}
                    >
                      <option value="">No Lead Assigned (Self-guided)</option>
                      {techLeads.map((tl) => (
                        <option key={tl.id} value={tl.id}>{tl.name} ({tl.email})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-[#8b949e] pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] active:scale-[0.98] transition text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 btn-press"
                >
                  {loading ? 'Creating Student profile...' : 'Register and Launch'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.form>
            )}

            {activeMode === 'register_tech_lead' && (
              <motion.form 
                key="register_tech_lead"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleRegisterTechLead} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-[#8b949e]" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-4 py-2.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                    Corporate Lead Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#8b949e]" />
                    <input
                      type="email"
                      placeholder="e.g. alex_new@techlead.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-4 py-2.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8b949e]" />
                      <input
                        type="password"
                        placeholder="At least 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-4 py-2.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8b949e]" />
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-10 pr-4 py-2.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] active:scale-[0.98] transition text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 btn-press"
                >
                  {loading ? 'Creating Engineering Lead profile...' : 'Register and Launch'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
