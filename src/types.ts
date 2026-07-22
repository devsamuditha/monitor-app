/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'intern' | 'tech_lead' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  assigned_tech_lead_id?: string;
  active?: boolean; // presence indicator
}

export interface Project {
  id: string;
  name: string;
  description: string;
  github_url: string;
  tech_stack: string[];
  owner_id: string;
  screenshots: string[];
}

export interface DailyLog {
  id: string;
  intern_id: string;
  project_id: string;
  summary: string;
  technologies: string[];
  changes: string; // changelog bullet style
  screenshot_url?: string;
  github_url: string;
  site_url?: string;
  date: string; // YYYY-MM-DD
  start_time?: string;
  planned_tasks?: string;
  morning_question?: string;
  question_resolution?: string;
  status: 'started' | 'submitted' | 'reviewed';
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  assigned_to: string; // intern_id
  assigned_by: string; // tech_lead_id
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at?: string;
  score?: number; // given by Tech Lead
  comment?: string; // Tech Lead review comment
}

export interface Mark {
  id: string;
  intern_id: string;
  given_by: string; // tech_lead_id
  related_log_id?: string;
  related_task_id?: string;
  score: number; // e.g. 1-5 or 1-100
  comment?: string;
  date: string;
}

export type MistakeSeverity = 'low' | 'medium' | 'high';

export interface Mistake {
  id: string;
  intern_id: string;
  flagged_by: string; // tech_lead_id
  related_log_id: string;
  note: string;
  severity: MistakeSeverity;
  date: string;
  resolved: boolean;
}

export interface Message {
  id: string;
  from_id: string;
  to_id: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Reply {
  id: string;
  user_id: string;
  content: string;
  timestamp: string;
}

export interface Question {
  id: string;
  intern_id: string;
  title: string;
  content: string;
  timestamp: string;
  replies: Reply[];
}

export interface TeamStats {
  complianceRate: number; // % who submitted today
  avgMarks: number;
  totalLogs: number;
  activeCount: number;
  totalTasks: number;
  completedTasks: number;
}
