/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  User, 
  Project, 
  DailyLog, 
  Task, 
  Mark, 
  Mistake, 
  Message, 
  Question,
  TaskPriority,
  TaskStatus,
  MistakeSeverity
} from "../types.js";

// Helper to construct request headers dynamically based on logged in user session
const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  const savedUserStr = sessionStorage.getItem('user');
  if (savedUserStr) {
    try {
      const user = JSON.parse(savedUserStr);
      if (user && user.id) {
        headers["x-user-id"] = user.id;
      }
    } catch (e) {
      console.error("Error parsing user from sessionStorage inside api services:", e);
    }
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errText = await response.text();
    let errMsg = "Something went wrong";
    try {
      const parsed = JSON.parse(errText);
      errMsg = parsed.error || errMsg;
    } catch {
      errMsg = errText || errMsg;
    }
    throw new Error(errMsg);
  }
  return response.json();
};

export const api = {
  // Config
  getConfig: async (): Promise<{ supabaseUrl: string; supabaseAnonKey: string }> => {
    const res = await fetch("/api/config");
    return handleResponse(res);
  },

  // Auth
  login: async (email: string, password?: string): Promise<{ user: User }> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  checkEmailExists: async (email: string): Promise<boolean> => {
    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await handleResponse(res);
    return data.exists;
  },

  registerUser: async (user: {
    id: string;
    email: string;
    password?: string;
    name: string;
    role: string;
    techLeadId?: string | null;
  }): Promise<{ user: User }> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    return handleResponse(res);
  },

  getPublicTechLeads: async (): Promise<User[]> => {
    const res = await fetch("/api/public/tech-leads");
    return handleResponse(res);
  },

  // Users
  getUsers: async (filters?: { role?: string; assigned_tech_lead_id?: string }): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append("role", filters.role);
    if (filters?.assigned_tech_lead_id) params.append("assigned_tech_lead_id", filters.assigned_tech_lead_id);
    const res = await fetch(`/api/users?${params.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  toggleUserStatus: async (userId: string, active: boolean): Promise<User> => {
    const res = await fetch(`/api/users/${userId}/status`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ active })
    });
    return handleResponse(res);
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await fetch("/api/projects", {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  saveProject: async (project: Partial<Project>): Promise<Project> => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(project)
    });
    return handleResponse(res);
  },

  // Daily Logs
  getLogs: async (filters?: { intern_id?: string; project_id?: string }): Promise<DailyLog[]> => {
    const params = new URLSearchParams();
    if (filters?.intern_id) params.append("intern_id", filters.intern_id);
    if (filters?.project_id) params.append("project_id", filters.project_id);
    const res = await fetch(`/api/logs?${params.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  startDay: async (data: {
    intern_id: string;
    project_id: string;
    planned_tasks: string;
    morning_question?: string;
  }): Promise<DailyLog> => {
    const res = await fetch("/api/logs/start", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  submitLog: async (log: {
    log_id?: string;
    intern_id: string;
    project_id: string;
    summary: string;
    technologies: string[];
    changes: string;
    screenshot_url?: string;
    github_url?: string;
    question_resolution?: string;
    site_url?: string;
  }): Promise<DailyLog> => {
    const res = await fetch("/api/logs", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(log)
    });
    return handleResponse(res);
  },

  reviewLog: async (
    logId: string,
    data: {
      reviewer_id: string;
      score: number;
      comment?: string;
      mistakesFlagged?: Array<{ note: string; severity: MistakeSeverity }>;
    }
  ): Promise<{ success: boolean; log: DailyLog }> => {
    const res = await fetch(`/api/logs/${logId}/review`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Tasks
  getTasks: async (filters?: { assigned_to?: string; assigned_by?: string }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.assigned_to) params.append("assigned_to", filters.assigned_to);
    if (filters?.assigned_by) params.append("assigned_by", filters.assigned_by);
    const res = await fetch(`/api/tasks?${params.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  assignTask: async (task: {
    assigned_to: string;
    assigned_by: string;
    title: string;
    description: string;
    due_date: string;
    priority: TaskPriority;
  }): Promise<Task> => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(task)
    });
    return handleResponse(res);
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus): Promise<Task> => {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  reviewTask: async (
    taskId: string,
    data: {
      reviewer_id: string;
      score: number;
      comment?: string;
    }
  ): Promise<Task> => {
    const res = await fetch(`/api/tasks/${taskId}/review`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Marks
  getMarks: async (internId?: string): Promise<Mark[]> => {
    const url = internId ? `/api/marks?intern_id=${internId}` : "/api/marks";
    const res = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Mistakes
  getMistakes: async (filters?: { intern_id?: string; resolved?: boolean }): Promise<Mistake[]> => {
    const params = new URLSearchParams();
    if (filters?.intern_id) params.append("intern_id", filters.intern_id);
    if (filters?.resolved !== undefined) params.append("resolved", filters.resolved ? "true" : "false");
    const res = await fetch(`/api/mistakes?${params.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  resolveMistake: async (mistakeId: string, resolved: boolean): Promise<Mistake> => {
    const res = await fetch(`/api/mistakes/${mistakeId}/resolve`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ resolved })
    });
    return handleResponse(res);
  },

  // Chat Messages
  getMessages: async (userA: string, userB: string): Promise<Message[]> => {
    const res = await fetch(`/api/messages?user_a=${userA}&user_b=${userB}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  sendMessage: async (message: { from_id: string; to_id: string; content: string }): Promise<Message> => {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(message)
    });
    return handleResponse(res);
  },

  // Threaded Questions
  getQuestions: async (): Promise<Question[]> => {
    const res = await fetch("/api/questions", {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  askQuestion: async (question: { intern_id: string; title: string; content: string }): Promise<Question> => {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(question)
    });
    return handleResponse(res);
  },

  replyToQuestion: async (questionId: string, reply: { user_id: string; content: string }): Promise<Question> => {
    const res = await fetch(`/api/questions/${questionId}/replies`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(reply)
    });
    return handleResponse(res);
  },

  // Analytics
  getAnalytics: async (techLeadId?: string): Promise<any> => {
    const url = techLeadId ? `/api/analytics?tech_lead_id=${techLeadId}` : "/api/analytics";
    const res = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
