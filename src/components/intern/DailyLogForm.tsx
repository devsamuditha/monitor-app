/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { api } from '../../services/api.js';
import { User, Project, DailyLog } from '../../types.js';
import { Plus, X, Upload, Github, Sparkles, Check } from 'lucide-react';

interface DailyLogFormProps {
  user: User;
  startedLog?: DailyLog;
  onSuccess: () => void;
}

const COMMON_TECHS = ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Motion', 'Python', 'FastAPI', 'Docker', 'Next.js'];

export const DailyLogForm: React.FC<DailyLogFormProps> = ({ user, startedLog, onSuccess }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(startedLog?.project_id || '');
  const [summary, setSummary] = useState('');
  const [changes, setChanges] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [questionResolution, setQuestionResolution] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [customTech, setCustomTech] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const pList = await api.getProjects();
        setProjects(pList);
        if (pList.length > 0) {
          if (startedLog) {
            setSelectedProjectId(startedLog.project_id);
            const proj = pList.find(p => p.id === startedLog.project_id);
            if (proj) setGithubUrl(proj.github_url);
          } else {
            const own = pList.find(p => p.owner_id === user.id);
            setSelectedProjectId(own ? own.id : pList[0].id);
            setGithubUrl(own ? own.github_url : pList[0].github_url);
          }
        }
      } catch (err) {
        console.error("Error loading projects", err);
      }
    };
    fetchProjects();
  }, [user]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedProjectId(pId);
    const proj = projects.find(p => p.id === pId);
    if (proj) {
      setGithubUrl(proj.github_url);
    }
  };

  const toggleTech = (tech: string) => {
    if (selectedTechs.includes(tech)) {
      setSelectedTechs(prev => prev.filter(t => t !== tech));
    } else {
      setSelectedTechs(prev => [...prev, tech]);
    }
  };

  const handleAddCustomTech = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTech.trim();
    if (clean && !selectedTechs.includes(clean)) {
      setSelectedTechs(prev => [...prev, clean]);
    }
    setCustomTech('');
  };

  // Convert uploaded file to base64
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setScreenshotUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Generate a gorgeous mock screenshot to test easily
  const generateMockScreenshot = () => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    ];
    const pickedGradient = gradients[Math.floor(Math.random() * gradients.length)];
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw background gradient
      const grad = ctx.createLinearGradient(0, 0, 600, 360);
      if (pickedGradient.includes('#667eea')) {
        grad.addColorStop(0, '#667eea'); grad.addColorStop(1, '#764ba2');
      } else if (pickedGradient.includes('#6366f1')) {
        grad.addColorStop(0, '#6366f1'); grad.addColorStop(1, '#a855f7');
      } else if (pickedGradient.includes('#10b981')) {
        grad.addColorStop(0, '#10b981'); grad.addColorStop(1, '#059669');
      } else {
        grad.addColorStop(0, '#f59e0b'); grad.addColorStop(1, '#d97706');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 360);

      // Draw standard dashboard cards mockup shape
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.roundRect ? ctx.roundRect(40, 40, 520, 280, 12) : ctx.fillRect(40, 40, 520, 280);
      ctx.fill();

      // Draw browser window buttons
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(65, 65, 6, 0, Math.PI * 2);
      ctx.arc(85, 65, 6, 0, Math.PI * 2);
      ctx.arc(105, 65, 6, 0, Math.PI * 2);
      ctx.fill();

      // Write text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('Simulated InternTrack App Draft', 130, 72);

      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('✨ Working beautifully in dev server on Port 3000!', 65, 140);
      ctx.fillText('🚀 Technologies: React + Tailwind CSS', 65, 180);
      ctx.fillText(`📅 Logged on: ${new Date().toLocaleDateString()}`, 65, 220);

      setScreenshotUrl(canvas.toDataURL());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a project.');
      return;
    }
    if (!summary.trim()) {
      setError('Please describe what you worked on today.');
      return;
    }
    if (!changes.trim()) {
      setError('Please outline what changed today (changelog).');
      return;
    }
    if (!githubUrl.startsWith('http://') && !githubUrl.startsWith('https://')) {
      setError('Please enter a valid GitHub commit or repo URL.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.submitLog({
        log_id: startedLog?.id,
        intern_id: user.id,
        project_id: selectedProjectId,
        summary: summary.trim(),
        technologies: selectedTechs,
        changes: changes.trim(),
        screenshot_url: screenshotUrl || undefined,
        github_url: githubUrl.trim() || undefined,
        question_resolution: questionResolution.trim() || undefined,
        site_url: siteUrl.trim() || undefined,
      });

      // Clear form on success
      setSummary('');
      setChanges('');
      setScreenshotUrl('');
      setSelectedTechs([]);
      
      // Trigger satisfying success checkmark
      setShowSuccessAnim(true);
      setTimeout(() => {
        setShowSuccessAnim(false);
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to submit log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="daily-log-form-container" className="glass-card p-6 relative overflow-hidden transition-all duration-200">
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
              Daily Log Submitted! 🔥
            </motion.h3>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-indigo-100 max-w-sm text-sm"
            >
              Your tech lead has been notified. Keep up the amazing streak!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[#f0f6fc] flex items-center gap-2">
            End of Day Check-out <Sparkles className="h-4 w-4 text-[#d29922] fill-[#d29922]" />
          </h2>
          <p className="text-xs text-[#8b949e]">Submit your final daily log. It takes less than 2 minutes.</p>
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
          <label className="block text-xs font-medium text-[#8b949e] mb-1">Project Name (Auto-selected)</label>
          <select 
            value={selectedProjectId} 
            disabled={!!startedLog}
            onChange={handleProjectChange}
            className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 glass-input disabled:opacity-50"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Short Summary */}
        <div>
          <label className="block text-xs font-medium text-[#8b949e] mb-1">What was updated in your project today?</label>
          <input 
            type="text"
            placeholder="e.g., Connected Stripe checkout API elements & handled checkout failures"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50"
          />
        </div>

        {/* Question Resolution (if they had a question) */}
        {startedLog && startedLog.morning_question && (
          <div>
            <label className="block text-xs font-medium text-[#8b949e] mb-1">
              Morning Question: <span className="text-[#c9d1d9] italic">{startedLog.morning_question}</span>
            </label>
            <textarea 
              rows={2}
              placeholder="What happened to your question? How was it resolved?"
              value={questionResolution}
              onChange={(e) => setQuestionResolution(e.target.value)}
              className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 text-xs glass-input"
            />
          </div>
        )}

        {/* Technologies used */}
        <div>
          <label className="block text-xs font-medium text-[#8b949e] mb-1">Technologies Used Today</label>
          <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto p-1 rounded-xl bg-[#161b22]/40 border border-[#30363d]">
            {COMMON_TECHS.map(tech => {
              const active = selectedTechs.includes(tech);
              return (
                <button
                  type="button"
                  key={tech}
                  onClick={() => toggleTech(tech)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 btn-press ${
                    active 
                      ? 'bg-[#238636] text-white shadow-sm shadow-[#238636]/20' 
                      : 'bg-[#30363d] text-[#8b949e] hover:bg-[#30363d]/80'
                  }`}
                >
                  {tech}
                </button>
              );
            })}
          </div>

          {/* Custom tag */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add custom tech tag..."
              value={customTech}
              onChange={(e) => setCustomTech(e.target.value)}
              className="flex-1 text-xs rounded-lg border border-[#30363d] bg-[#0d1117]/60 px-3 py-1.5 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50"
            />
            <button
              type="button"
              onClick={handleAddCustomTech}
              className="p-1.5 rounded-lg bg-[#58a6ff]/10 text-[#58a6ff] hover:bg-[#58a6ff]/15 border border-[#58a6ff]/30"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Changelog bullet-friendly */}
        <div>
          <label className="block text-xs font-medium text-[#8b949e] mb-1">Detailed Changes (Changelog / bullet style)</label>
          <textarea
            rows={3}
            placeholder="- Fixed responsive CSS wrapping bug on shipping panels&#10;- Integrated custom form validations with custom errors&#10;- Removed hardcoded local host API routes"
            value={changes}
            onChange={(e) => setChanges(e.target.value)}
            className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50 font-mono text-xs glass-input"
          />
        </div>

        {/* GitHub & Site links */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#8b949e] mb-1">GitHub Repo/Commit URL</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b949e]">
                <Github className="h-4 w-4" />
              </span>
              <input 
                type="url"
                placeholder="https://github.com/..."
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 pl-9 pr-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b949e] mb-1">Site URL (Optional)</label>
            <input 
              type="url"
              placeholder="https://my-app.vercel.app"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className="w-full text-sm rounded-xl border border-[#30363d] bg-[#0d1117]/60 px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]/50"
            />
          </div>
        </div>

        {/* Drag & Drop Screenshot */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-[#8b949e]">Screenshot Upload</label>
            <button
              type="button"
              onClick={generateMockScreenshot}
              className="text-[10px] font-semibold text-[#58a6ff] hover:underline flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" /> Auto-generate Mock Screenshot for Demo
            </button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-[#58a6ff] bg-[#58a6ff]/8' 
                : 'border-[#30363d] bg-[#161b22]/40 hover:border-[#58a6ff]/60'
            }`}
          >
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
              id="file-upload" 
            />
            
            {screenshotUrl ? (
              <div className="relative group max-w-xs mx-auto">
                <img 
                  src={screenshotUrl} 
                  alt="Uploaded preview" 
                  className="rounded-lg max-h-40 object-cover w-full shadow-sm border border-slate-100 dark:border-slate-800" 
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setScreenshotUrl(''); }}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
                <label htmlFor="file-upload" className="block cursor-pointer">
                  <Upload className="mx-auto h-6 w-6 text-[#8b949e] mb-1.5" />
                  <p className="text-xs font-medium text-[#c9d1d9]">Drag & drop or <span className="text-[#58a6ff] underline">browse</span></p>
                  <p className="text-[10px] text-[#8b949e] mt-1">PNG, JPG, GIF up to 5MB</p>
                </label>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-white font-medium bg-[#238636] hover:bg-[#2ea043] active:scale-[0.98] transition-all duration-150 text-sm flex items-center justify-center gap-2 disabled:opacity-50 btn-press"
        >
          {loading ? 'Submitting...' : 'Submit Daily Log 🔥'}
        </button>
      </form>
    </div>
  );
};
