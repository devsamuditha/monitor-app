/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
};

export const getTaskPriorityColor = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'low':
      return 'bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/20';
    case 'medium':
      return 'bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/20';
    case 'high':
      return 'bg-[#f85149]/10 text-[#f85149] border border-[#f85149]/20';
    default:
      return 'bg-[#30363d] text-[#8b949e] border border-[#30363d]';
  }
};

export const getTaskStatusColor = (status: 'todo' | 'in_progress' | 'done') => {
  switch (status) {
    case 'todo':
      return 'bg-[#30363d] text-[#8b949e] border border-[#30363d]';
    case 'in_progress':
      return 'bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/20';
    case 'done':
      return 'bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/20';
    default:
      return 'bg-[#30363d] text-[#8b949e] border border-[#30363d]';
  }
};
