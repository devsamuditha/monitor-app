import dotenv from "dotenv";
dotenv.config(); // Load environment variables

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getPrisma } from "./src/db/prisma.js";
import { getSupabaseAdmin, uploadBase64Image } from "./src/lib/supabase.js";
import { Role, TaskStatus, TaskPriority, MistakeSeverity } from "@prisma/client";
import bcrypt from "bcryptjs";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to format date strings relative to today
const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

// --- SCHEMA MAPPER FUNCTIONS ---
function mapUser(dbUser: any) {
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role.toLowerCase(), // INTERN -> intern, TECH_LEAD -> tech_lead, etc.
    avatar: dbUser.avatarUrl,
    assigned_tech_lead_id: dbUser.techLeadId || undefined,
    active: dbUser.isActive,
  };
}

function mapProject(dbProj: any) {
  if (!dbProj) return null;
  return {
    id: dbProj.id,
    name: dbProj.name,
    description: dbProj.description,
    github_url: dbProj.githubUrl,
    tech_stack: dbProj.techStack,
    owner_id: dbProj.ownerId,
    screenshots: dbProj.screenshots || [],
  };
}

function mapDailyLog(dbLog: any) {
  if (!dbLog) return null;
  return {
    id: dbLog.id,
    intern_id: dbLog.internId,
    project_id: dbLog.projectId,
    summary: dbLog.summary,
    technologies: dbLog.technologies,
    changes: dbLog.changes,
    screenshot_url: dbLog.screenshotUrl || undefined,
    github_url: dbLog.githubUrl,
    date: dbLog.date,
    status: dbLog.status, // started, submitted, or reviewed
    start_time: dbLog.startTime ? dbLog.startTime.toISOString() : undefined,
    planned_tasks: dbLog.plannedTasks || undefined,
    morning_question: dbLog.morningQuestion || undefined,
    question_resolution: dbLog.questionResolution || undefined,
    site_url: dbLog.siteUrl || undefined,
  };
}

function mapTask(dbTask: any) {
  if (!dbTask) return null;
  return {
    id: dbTask.id,
    assigned_to: dbTask.assignedToId,
    assigned_by: dbTask.assignedById,
    title: dbTask.title,
    description: dbTask.description,
    due_date: dbTask.dueDate,
    priority: dbTask.priority.toLowerCase(), // HIGH -> high, etc.
    status: dbTask.status.toLowerCase(), // TODO -> todo, etc.
    completed_at: dbTask.completedAt || undefined,
    score: dbTask.score || undefined,
    comment: dbTask.comment || undefined,
  };
}

function mapMark(dbMark: any) {
  if (!dbMark) return null;
  return {
    id: dbMark.id,
    intern_id: dbMark.internId,
    given_by: dbMark.givenById,
    related_log_id: dbMark.relatedLogId || undefined,
    related_task_id: dbMark.relatedTaskId || undefined,
    score: dbMark.score,
    comment: dbMark.comment || undefined,
    date: dbMark.date,
  };
}

function mapMistake(dbMistake: any) {
  if (!dbMistake) return null;
  return {
    id: dbMistake.id,
    intern_id: dbMistake.internId,
    flagged_by: dbMistake.flaggedById,
    related_log_id: dbMistake.relatedLogId,
    note: dbMistake.note,
    severity: dbMistake.severity.toLowerCase(), // HIGH -> high, etc.
    date: dbMistake.date,
    resolved: dbMistake.resolved,
  };
}

function mapMessage(dbMsg: any) {
  if (!dbMsg) return null;
  return {
    id: dbMsg.id,
    from_id: dbMsg.fromId,
    to_id: dbMsg.toId,
    content: dbMsg.content,
    timestamp: dbMsg.createdAt.toISOString(),
    read: dbMsg.read,
  };
}

function mapQuestion(dbQ: any) {
  if (!dbQ) return null;
  return {
    id: dbQ.id,
    intern_id: dbQ.internId,
    title: dbQ.title,
    content: dbQ.content,
    timestamp: dbQ.createdAt.toISOString(),
    replies: dbQ.replies ? dbQ.replies.map((r: any) => ({
      id: r.id,
      user_id: r.authorId,
      content: r.content,
      timestamp: r.createdAt.toISOString(),
    })) : [],
  };
}

function calculateStreak(logs: any[]): number {
  const dates = Array.from(new Set(logs.map(l => l.date))).sort();
  if (dates.length === 0) return 0;
  
  let streak = 0;
  let currentOffset = 0;
  
  const todayStr = getRelativeDateStr(0);
  const yesterdayStr = getRelativeDateStr(-1);
  
  let targetDate = dates.includes(todayStr) ? todayStr : (dates.includes(yesterdayStr) ? yesterdayStr : null);
  if (!targetDate) return 0;
  
  while (true) {
    const checkDate = getRelativeDateStr(currentOffset - (dates.includes(todayStr) ? 0 : 1));
    if (dates.includes(checkDate)) {
      streak++;
      currentOffset--;
    } else {
      break;
    }
  }
  return streak;
}

// --- AUTH MIDDLEWARE ---
const authMiddleware = async (req: any, res: any, next: any) => {
  const userId = req.headers['x-user-id'] || req.query.userId;
  
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user session found. Please log in." });
  }

  try {
    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({
      where: { id: String(userId) },
    });

    if (!dbUser) {
      return res.status(401).json({ error: "Unauthorized: Active user not found in the database." });
    }

    if (!dbUser.isActive) {
      return res.status(403).json({ error: "Forbidden: This account has been deactivated by the administrator." });
    }

    req.user = dbUser;
    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    // Continue if Database is not fully provisioned to allow schema migrations/seeding
    if (error.message.includes("is not defined")) {
      return res.status(503).json({ error: error.message });
    }
    res.status(500).json({ error: "Database error: Please run migrations and seed the database." });
  }
};

// --- API ROUTES ---

// Public Config (Return public supabase settings for client-side Realtime & Auth)
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  });
});

// Auth Login / Direct Shortcut Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: "No account found with this email in the database" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "This account is inactive. Please contact your manager." });
    }

    // If a password is provided (actual login flow) and the user has a password in DB, verify it
    // @ts-ignore: VS Code TS server caches old Prisma types, bypassing error
    if (password && user.password) {
      // @ts-ignore
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Incorrect password. Please try again." });
      }
    }

    res.json({ user: mapUser(user) });
  } catch (error: any) {
    console.error("Login endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Check if email already exists in the database
app.post("/api/auth/check-email", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    res.json({ exists: !!user });
  } catch (error: any) {
    console.error("Check email endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Register a new user in the database
app.post("/api/auth/register", async (req, res) => {
  const { id, email, name, role, techLeadId, password } = req.body;
  if (!email || !name || !role) {
    return res.status(400).json({ error: "Email, name, and role are required" });
  }

  try {
    const prisma = getPrisma();
    const prismaRole = role.toUpperCase() as Role;
    if (prismaRole !== Role.INTERN && prismaRole !== Role.TECH_LEAD) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Double check email uniqueness in database
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return res.status(400).json({ error: "Email already registered in database" });
    }

    // Assign standard friendly placeholders as avatars
    const avatarUrl = prismaRole === Role.INTERN
      ? `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`
      : `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;

    // Hash the password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.create({
      // @ts-ignore: VS Code TS server caches old Prisma types, bypassing error
      data: {
        id: id || undefined,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: prismaRole,
        avatarUrl,
        techLeadId: prismaRole === Role.INTERN ? (techLeadId || null) : null,
        isActive: true,
      },
    });

    res.status(201).json({ user: mapUser(user) });
  } catch (error: any) {
    console.error("Registration endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Public Active Tech Leads (unauthenticated for registration dropdown)
app.get("/api/public/tech-leads", async (req, res) => {
  try {
    const prisma = getPrisma();
    const leads = await prisma.user.findMany({
      where: { role: Role.TECH_LEAD, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(leads.map(mapUser));
  } catch (error: any) {
    console.error("Public tech-leads endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Users with filtering
app.get("/api/users", authMiddleware, async (req, res) => {
  const { role, assigned_tech_lead_id } = req.query;
  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (role) {
      whereClause.role = String(role).toUpperCase();
    }
    if (assigned_tech_lead_id) {
      whereClause.techLeadId = String(assigned_tech_lead_id);
    }

    const dbUsers = await prisma.user.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    res.json(dbUsers.map(mapUser));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle working status (active/inactive)
app.post("/api/users/:id/status", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  try {
    const prisma = getPrisma();
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !!active },
    });
    res.json(mapUser(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Projects
app.get("/api/projects", authMiddleware, async (req, res) => {
  try {
    const prisma = getPrisma();
    const dbProjects = await prisma.project.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(dbProjects.map(mapProject));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update Project
app.post("/api/projects", authMiddleware, async (req, res) => {
  const { id, name, description, github_url, tech_stack, owner_id, screenshots } = req.body;
  try {
    const prisma = getPrisma();
    if (id) {
      const updated = await prisma.project.update({
        where: { id },
        data: {
          name,
          description,
          githubUrl: github_url,
          techStack: tech_stack || [],
          screenshots: screenshots || [],
        },
      });
      return res.json(mapProject(updated));
    }

    const created = await prisma.project.create({
      data: {
        name,
        description,
        githubUrl: github_url,
        techStack: tech_stack || [],
        ownerId: owner_id,
        screenshots: screenshots || ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"],
      },
    });
    res.json(mapProject(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Daily Logs
app.get("/api/logs", authMiddleware, async (req, res) => {
  const { intern_id, project_id } = req.query;
  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }
    if (project_id) {
      whereClause.projectId = String(project_id);
    }

    const dbLogs = await prisma.dailyLog.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });

    res.json(dbLogs.map(mapDailyLog));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start Day
app.post("/api/logs/start", authMiddleware, async (req, res) => {
  const { intern_id, project_id, planned_tasks, morning_question } = req.body;
  if (!intern_id || !project_id || !planned_tasks) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const prisma = getPrisma();
    const todayStr = getRelativeDateStr(0);

    const created = await prisma.dailyLog.create({
      data: {
        internId: intern_id,
        projectId: project_id,
        summary: "",
        technologies: [],
        changes: "",
        githubUrl: "",
        date: todayStr,
        status: 'started',
        startTime: new Date(),
        plannedTasks: planned_tasks,
        morningQuestion: morning_question,
      },
    });

    res.json(mapDailyLog(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Daily Log with Base64 screenshot upload proxy (End Day)
app.post("/api/logs", authMiddleware, async (req, res) => {
  const { log_id, intern_id, project_id, summary, technologies, changes, screenshot_url, github_url, question_resolution, site_url } = req.body;
  if (!intern_id || !project_id || !summary || !changes) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const prisma = getPrisma();
    const todayStr = getRelativeDateStr(0);

    // Upload to Supabase Storage if base64 screenshot is sent
    let resolvedScreenshotUrl = screenshot_url || null;
    if (screenshot_url && screenshot_url.startsWith('data:image/')) {
      try {
        resolvedScreenshotUrl = await uploadBase64Image(screenshot_url);
      } catch (err) {
        console.error("Storage upload failed, keeping original base64/placeholder:", err);
      }
    }

    if (log_id) {
      // End day by updating the started log
      const updated = await prisma.dailyLog.update({
        where: { id: log_id },
        data: {
          summary,
          technologies: technologies || [],
          changes,
          screenshotUrl: resolvedScreenshotUrl,
          githubUrl: github_url || "",
          questionResolution: question_resolution,
          siteUrl: site_url,
          status: 'submitted',
        },
      });
      return res.json(mapDailyLog(updated));
    }

    const created = await prisma.dailyLog.create({
      data: {
        internId: intern_id,
        projectId: project_id,
        summary,
        technologies: technologies || [],
        changes,
        screenshotUrl: resolvedScreenshotUrl,
        githubUrl: github_url || "",
        siteUrl: site_url,
        questionResolution: question_resolution,
        date: todayStr,
        status: 'submitted',
      },
    });

    res.json(mapDailyLog(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Review Log (Tech Lead reviews log, awards marks, flags blunders)
app.post("/api/logs/:id/review", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { reviewer_id, score, comment, mistakesFlagged } = req.body;
  try {
    const prisma = getPrisma();
    const log = await prisma.dailyLog.findUnique({ where: { id } });
    if (!log) return res.status(404).json({ error: "Daily log not found" });

    // Update log status to reviewed
    const updatedLog = await prisma.dailyLog.update({
      where: { id },
      data: { status: 'reviewed' },
    });

    const todayStr = getRelativeDateStr(0);

    // Create Mark
    if (score !== undefined) {
      await prisma.mark.create({
        data: {
          internId: log.internId,
          givenById: reviewer_id,
          relatedLogId: log.id,
          score: Number(score),
          comment: comment || null,
          date: todayStr,
        }
      });
    }

    // Create Mistakes
    if (mistakesFlagged && Array.isArray(mistakesFlagged)) {
      for (const m of mistakesFlagged) {
        await prisma.mistake.create({
          data: {
            internId: log.internId,
            flaggedById: reviewer_id,
            relatedLogId: log.id,
            note: m.note,
            severity: String(m.severity).toUpperCase() as any,
            date: todayStr,
            resolved: false,
          }
        });
      }
    }

    res.json({ success: true, log: mapDailyLog(updatedLog) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Tasks
app.get("/api/tasks", authMiddleware, async (req, res) => {
  const { assigned_to, assigned_by } = req.query;
  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (assigned_to) {
      whereClause.assignedToId = String(assigned_to);
    }
    if (assigned_by) {
      whereClause.assignedById = String(assigned_by);
    }

    const dbTasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    res.json(dbTasks.map(mapTask));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assign Task
app.post("/api/tasks", authMiddleware, async (req, res) => {
  const { assigned_to, assigned_by, title, description, due_date, priority } = req.body;
  if (!assigned_to || !assigned_by || !title || !description || !due_date || !priority) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const prisma = getPrisma();
    const created = await prisma.task.create({
      data: {
        assignedToId: assigned_to,
        assignedById: assigned_by,
        title,
        description,
        dueDate: due_date,
        priority: String(priority).toUpperCase() as any,
        status: TaskStatus.TODO,
      },
    });

    res.json(mapTask(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Task Status
app.post("/api/tasks/:id/status", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const prisma = getPrisma();
    const todayStr = getRelativeDateStr(0);
    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: String(status).toUpperCase() as any,
        completedAt: status === 'done' ? todayStr : null,
      },
    });
    res.json(mapTask(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Score Task Review
app.post("/api/tasks/:id/review", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { reviewer_id, score, comment } = req.body;
  try {
    const prisma = getPrisma();
    const todayStr = getRelativeDateStr(0);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        score: Number(score),
        comment: comment || null,
      },
    });

    await prisma.mark.create({
      data: {
        internId: updatedTask.assignedToId,
        givenById: reviewer_id,
        relatedTaskId: updatedTask.id,
        score: Number(score),
        comment: comment || null,
        date: todayStr,
      }
    });

    res.json(mapTask(updatedTask));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Marks
app.get("/api/marks", authMiddleware, async (req, res) => {
  const { intern_id } = req.query;
  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }
    const dbMarks = await prisma.mark.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
    res.json(dbMarks.map(mapMark));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Mistakes
app.get("/api/mistakes", authMiddleware, async (req, res) => {
  const { intern_id, resolved } = req.query;
  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }
    if (resolved !== undefined) {
      whereClause.resolved = resolved === 'true';
    }

    const dbMistakes = await prisma.mistake.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    res.json(dbMistakes.map(mapMistake));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve Mistake
app.post("/api/mistakes/:id/resolve", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { resolved } = req.body;
  try {
    const prisma = getPrisma();
    const updated = await prisma.mistake.update({
      where: { id },
      data: { resolved: !!resolved },
    });
    res.json(mapMistake(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Chat Messages per conversation (intern <-> tech lead)
app.get("/api/messages", authMiddleware, async (req, res) => {
  const { user_a, user_b } = req.query;
  if (!user_a || !user_b) {
    return res.status(400).json({ error: "Missing parameters user_a or user_b" });
  }
  try {
    const prisma = getPrisma();
    const dbMsgs = await prisma.message.findMany({
      where: {
        OR: [
          { fromId: String(user_a), toId: String(user_b) },
          { fromId: String(user_b), toId: String(user_a) },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(dbMsgs.map(mapMessage));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send Chat Message
app.post("/api/messages", authMiddleware, async (req, res) => {
  const { from_id, to_id, content } = req.body;
  if (!from_id || !to_id || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const prisma = getPrisma();
    const created = await prisma.message.create({
      data: {
        fromId: from_id,
        toId: to_id,
        content,
      },
    });
    res.json(mapMessage(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Threaded Questions with nested replies
app.get("/api/questions", authMiddleware, async (req, res) => {
  try {
    const prisma = getPrisma();
    const dbQs = await prisma.question.findMany({
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(dbQs.map(mapQuestion));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ask Question
app.post("/api/questions", authMiddleware, async (req, res) => {
  const { intern_id, title, content } = req.body;
  if (!intern_id || !title || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const prisma = getPrisma();
    const created = await prisma.question.create({
      data: {
        internId: intern_id,
        title,
        content,
      },
      include: { replies: true },
    });
    res.json(mapQuestion(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reply to Question
app.post("/api/questions/:id/replies", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { user_id, content } = req.body;
  if (!user_id || !content) {
    return res.status(400).json({ error: "Missing user_id or content" });
  }
  try {
    const prisma = getPrisma();
    await prisma.reply.create({
      data: {
        questionId: id,
        authorId: user_id,
        content,
      },
    });

    const updatedQ = await prisma.question.findUnique({
      where: { id },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    res.json(mapQuestion(updatedQ));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Analytics (Rich aggregated dashboard data)
app.get("/api/analytics", authMiddleware, async (req, res) => {
  const { tech_lead_id } = req.query;
  try {
    const prisma = getPrisma();

    // 1. Get all interns
    const internsClause: any = { role: Role.INTERN };
    if (tech_lead_id) {
      internsClause.techLeadId = String(tech_lead_id);
    }
    const targetInterns = await prisma.user.findMany({
      where: internsClause,
    });
    const internIds = targetInterns.map(i => i.id);

    // 2. Fetch datasets
    const allLogs = await prisma.dailyLog.findMany({
      where: { internId: { in: internIds } },
    });
    const allMarks = await prisma.mark.findMany({
      where: { internId: { in: internIds } },
    });
    const allTasks = await prisma.task.findMany({
      where: { assignedToId: { in: internIds } },
    });
    const allMistakes = await prisma.mistake.findMany({
      where: { internId: { in: internIds } },
    });

    // 3. High level stats
    const todayStr = getRelativeDateStr(0);
    const submittedTodayCount = allLogs.filter(l => l.date === todayStr).length;
    const complianceRate = targetInterns.length > 0 ? Math.round((submittedTodayCount / targetInterns.length) * 100) : 0;
    const avgMarks = allMarks.length > 0 ? parseFloat((allMarks.reduce((acc, curr) => acc + curr.score, 0) / allMarks.length).toFixed(1)) : 0;
    const totalLogs = allLogs.length;
    const activeCount = targetInterns.filter(u => u.isActive).length;
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === TaskStatus.DONE).length;

    // 4. Roster data per intern
    const rosterData = targetInterns.map(intern => {
      const iLogs = allLogs.filter(l => l.internId === intern.id);
      const iMarks = allMarks.filter(m => m.internId === intern.id);
      const iTasks = allTasks.filter(t => t.assignedToId === intern.id);
      const iMistakes = allMistakes.filter(m => m.internId === intern.id);

      const lastSub = iLogs.length > 0 ? iLogs.sort((a, b) => b.date.localeCompare(a.date))[0].date : "Never";
      const iAvgMark = iMarks.length > 0 ? parseFloat((iMarks.reduce((acc, curr) => acc + curr.score, 0) / iMarks.length).toFixed(1)) : 0;

      return {
        intern: {
          id: intern.id,
          name: intern.name,
          email: intern.email,
          avatar: intern.avatarUrl,
          active: intern.isActive,
          assigned_tech_lead_id: intern.techLeadId || undefined,
        },
        lastSubmission: lastSub,
        streak: calculateStreak(iLogs),
        avgMark: iAvgMark,
        totalTasks: iTasks.length,
        completedTasks: iTasks.filter(t => t.status === TaskStatus.DONE).length,
        unresolvedMistakesCount: iMistakes.filter(m => !m.resolved).length,
      };
    });

    // 5. Last 7 days Trends
    const last7Days = Array.from({ length: 7 }, (_, idx) => getRelativeDateStr(-idx)).reverse();
    const submissionTrend = last7Days.map(dateStr => {
      const subsCount = allLogs.filter(l => l.date === dateStr).length;
      return {
        date: dateStr,
        count: subsCount,
      };
    });

    const marksTrend = last7Days.map(dateStr => {
      const marksOnDate = allMarks.filter(m => m.date === dateStr);
      const avgScore = marksOnDate.length > 0 ? parseFloat((marksOnDate.reduce((acc, curr) => acc + curr.score, 0) / marksOnDate.length).toFixed(1)) : 0;
      return {
        date: dateStr,
        score: avgScore,
      };
    });

    // 6. Technology distribution
    const techCounts: Record<string, number> = {};
    allLogs.forEach(l => {
      l.technologies.forEach(tech => {
        techCounts[tech] = (techCounts[tech] || 0) + 1;
      });
    });
    const mostUsedTechs = Object.entries(techCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const recentLogs = allLogs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20)
      .map(log => {
        const intern = targetInterns.find(i => i.id === log.internId);
        return {
          ...mapDailyLog(log),
          intern_name: intern?.name || 'Unknown',
          intern_avatar: intern?.avatarUrl || ''
        };
      });

    res.json({
      complianceRate,
      avgMarks,
      totalLogs,
      activeCount,
      totalTasks,
      completedTasks,
      rosterData,
      submissionTrend,
      marksTrend,
      mostUsedTechs,
      recentLogs,
    });
  } catch (error: any) {
    console.error("Analytics endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- VITE MIDDLEWARE SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
