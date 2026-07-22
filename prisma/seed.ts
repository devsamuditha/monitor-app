import { PrismaClient, Role, TaskStatus, TaskPriority, MistakeSeverity } from '@prisma/client';

const prisma = new PrismaClient();

const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

async function main() {
  console.log('Clearing database...');
  // Delete in reverse order of dependencies to avoid foreign key violations
  await prisma.reply.deleteMany();
  await prisma.question.deleteMany();
  await prisma.message.deleteMany();
  await prisma.mistake.deleteMany();
  await prisma.mark.deleteMany();
  await prisma.task.deleteMany();
  await prisma.dailyLog.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');

  // 1. Seed Manager
  const manager = await prisma.user.create({
    data: {
      id: "m-elena",
      name: "Elena Rostova",
      email: "elena@manager.com",
      role: Role.MANAGER,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    },
  });

  // 2. Seed Tech Leads
  const tlAlex = await prisma.user.create({
    data: {
      id: "tl-alex",
      name: "Alex Rivera",
      email: "alex@techlead.com",
      role: Role.TECH_LEAD,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    },
  });

  const tlJordan = await prisma.user.create({
    data: {
      id: "tl-jordan",
      name: "Jordan Vance",
      email: "jordan@techlead.com",
      role: Role.TECH_LEAD,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    },
  });

  // 3. Seed Interns
  const sam = await prisma.user.create({
    data: {
      id: "int-sam",
      name: "Sam Chen",
      email: "sam@intern.com",
      role: Role.INTERN,
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      techLeadId: tlAlex.id,
      isActive: true,
    },
  });

  const liam = await prisma.user.create({
    data: {
      id: "int-liam",
      name: "Liam O'Connor",
      email: "liam@intern.com",
      role: Role.INTERN,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      techLeadId: tlAlex.id,
      isActive: true,
    },
  });

  const sophia = await prisma.user.create({
    data: {
      id: "int-sophia",
      name: "Sophia Martinez",
      email: "sophia@intern.com",
      role: Role.INTERN,
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      techLeadId: tlAlex.id,
      isActive: true,
    },
  });

  const maya = await prisma.user.create({
    data: {
      id: "int-maya",
      name: "Maya Lin",
      email: "maya@intern.com",
      role: Role.INTERN,
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      techLeadId: tlJordan.id,
      isActive: true,
    },
  });

  const ethan = await prisma.user.create({
    data: {
      id: "int-ethan",
      name: "Ethan Hunt",
      email: "ethan@intern.com",
      role: Role.INTERN,
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      techLeadId: tlJordan.id,
      isActive: true,
    },
  });

  const zoe = await prisma.user.create({
    data: {
      id: "int-zoe",
      name: "Zoe Taylor",
      email: "zoe@intern.com",
      role: Role.INTERN,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      techLeadId: tlJordan.id,
      isActive: true,
    },
  });

  console.log('Seeding Projects...');

  const pEcom = await prisma.project.create({
    data: {
      id: "p-ecom",
      name: "E-Commerce Checkout Revamp",
      description: "Optimizing the multi-step checkout workflow using React and Tailwind to reduce drop-offs.",
      githubUrl: "https://github.com/interntrack-org/checkout-revamp",
      techStack: ["React", "TypeScript", "Tailwind CSS", "Vite", "Motion"],
      ownerId: sam.id,
      screenshots: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?auto=format&fit=crop&w=600&q=80"
      ],
    },
  });

  const pAnalytics = await prisma.project.create({
    data: {
      id: "p-analytics",
      name: "Real-time Metrics Dashboard",
      description: "Aggregating application performance logs and visualizing database throughput trends.",
      githubUrl: "https://github.com/interntrack-org/telemetry-dash",
      techStack: ["Node.js", "Express", "D3.js", "Recharts", "PostgreSQL"],
      ownerId: liam.id,
      screenshots: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
      ],
    },
  });

  const pAuth = await prisma.project.create({
    data: {
      id: "p-auth",
      name: "Secure Multi-tenant Auth Gateway",
      description: "Refactoring standard OAuth flows and setting up cookie-based session verification.",
      githubUrl: "https://github.com/interntrack-org/auth-gateway",
      techStack: ["TypeScript", "Express", "Redis", "OAuth2", "Prisma"],
      ownerId: sophia.id,
      screenshots: [
        "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80"
      ],
    },
  });

  const pBot = await prisma.project.create({
    data: {
      id: "p-bot",
      name: "AI Support Assist Companion",
      description: "Integrating LLM embeddings to answer support tickets from public product documentation.",
      githubUrl: "https://github.com/interntrack-org/ai-support",
      techStack: ["React", "Python", "FastAPI", "Gemini API", "ChromaDB"],
      ownerId: maya.id,
      screenshots: [
        "https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?auto=format&fit=crop&w=600&q=80"
      ],
    },
  });

  console.log('Seeding Daily Logs, Marks, Mistakes...');

  // Sam's Logs (5 days)
  const logsData = [
    {
      id: "log-sam-1",
      internId: sam.id,
      projectId: pEcom.id,
      summary: "Created the checkout layout structure and progress indicator using Framer Motion.",
      technologies: ["React", "Tailwind CSS", "Motion"],
      changes: "- Scaffolded StepIndicator component\n- Hooked up responsive transition states\n- Fixed mobile layout overflows in the sidebar",
      githubUrl: "https://github.com/interntrack-org/checkout-revamp/commit/8f2c3b5",
      date: getRelativeDateStr(-4),
      status: "reviewed",
      score: 5,
      comment: "Fantastic structural layout and attention to detail Sam. The transition feels incredibly snappy!"
    },
    {
      id: "log-sam-2",
      internId: sam.id,
      projectId: pEcom.id,
      summary: "Integrated form validators using Zod and created the Shipping details inputs.",
      technologies: ["React", "TypeScript", "Tailwind CSS"],
      changes: "- Configured standard address regex checks\n- Integrated custom error notifications\n- Refactored reusable TextInput primitives",
      githubUrl: "https://github.com/interntrack-org/checkout-revamp/commit/2d1a5c6",
      date: getRelativeDateStr(-3),
      status: "reviewed",
      score: 4,
      comment: "Zod validators are extremely robust. Keep an eye on line spacing around helper functions.",
      mistake: "Hardcoded API URL prefix directly inside checkout form rather than reading it from environment variables.",
      mistakeSeverity: MistakeSeverity.MEDIUM,
      mistakeResolved: true
    },
    {
      id: "log-sam-3",
      internId: sam.id,
      projectId: pEcom.id,
      summary: "Implemented the payment option toggles and integrated Stripe Elements sandbox.",
      technologies: ["React", "TypeScript", "Tailwind CSS"],
      changes: "- Embedded mock secure payment field wrapper\n- Added active focus styling with a custom gold streak indicator\n- Handled error responses for declined mock cards",
      githubUrl: "https://github.com/interntrack-org/checkout-revamp/commit/4f8e7d2",
      date: getRelativeDateStr(-2),
      status: "reviewed",
      score: 5,
      comment: "Exceptional Stripe integration. Very clean error handlers and responsive warning banners."
    },
    {
      id: "log-sam-4",
      internId: sam.id,
      projectId: pEcom.id,
      summary: "Completed checkout summary math and cart order calculations, resolving decimal floats.",
      technologies: ["React", "TypeScript"],
      changes: "- Implemented currency rounding utility\n- Created visual discounts list tags\n- Solved floating-point addition bug (0.1 + 0.2 precision error)",
      githubUrl: "https://github.com/interntrack-org/checkout-revamp/commit/9e8b11c",
      date: getRelativeDateStr(-1),
      status: "submitted"
    },
    {
      id: "log-sam-5",
      internId: sam.id,
      projectId: pEcom.id,
      summary: "Designed high-fidelity success confirmation card and integrated satisfying confetti trigger.",
      technologies: ["React", "Motion", "Tailwind CSS"],
      changes: "- Created a custom scaling spring checkmark SVG icon\n- Integrated light particle canvas emitter on submission completion\n- Saved customer session receipt ID to state",
      githubUrl: "https://github.com/interntrack-org/checkout-revamp/commit/b8d7a12",
      date: getRelativeDateStr(0),
      status: "submitted"
    }
  ];

  for (const logItem of logsData) {
    const createdLog = await prisma.dailyLog.create({
      data: {
        id: logItem.id,
        internId: logItem.internId,
        projectId: logItem.projectId,
        summary: logItem.summary,
        technologies: logItem.technologies,
        changes: logItem.changes,
        githubUrl: logItem.githubUrl,
        date: logItem.date,
        status: logItem.status,
      },
    });

    if (logItem.score) {
      await prisma.mark.create({
        data: {
          internId: logItem.internId,
          givenById: tlAlex.id,
          relatedLogId: createdLog.id,
          score: logItem.score,
          comment: logItem.comment,
          date: logItem.date,
        }
      });
    }

    if (logItem.mistake) {
      await prisma.mistake.create({
        data: {
          internId: logItem.internId,
          flaggedById: tlAlex.id,
          relatedLogId: createdLog.id,
          note: logItem.mistake,
          severity: logItem.mistakeSeverity!,
          date: logItem.date,
          resolved: logItem.mistakeResolved || false,
        }
      });
    }
  }

  // Liam's logs
  const logLiam1 = await prisma.dailyLog.create({
    data: {
      id: "log-liam-1",
      internId: liam.id,
      projectId: pAnalytics.id,
      summary: "Scaffolded Node Express logger service and connected initial Winston transport streams.",
      technologies: ["Node.js", "Express"],
      changes: "- Set up dev server configs\n- Registered basic routing middleware\n- Added automated test suites for GET /metrics endpoint",
      githubUrl: "https://github.com/interntrack-org/telemetry-dash/commit/7a2e301",
      date: getRelativeDateStr(-2),
      status: "reviewed",
    }
  });

  await prisma.mistake.create({
    data: {
      id: "mst-2",
      internId: liam.id,
      flaggedById: tlAlex.id,
      relatedLogId: logLiam1.id,
      note: "Committed raw PostgreSQL database credentials directly to standard configuration files inside the source repo.",
      severity: MistakeSeverity.HIGH,
      date: getRelativeDateStr(-2),
      resolved: false,
    }
  });

  await prisma.dailyLog.create({
    data: {
      id: "log-liam-2",
      internId: liam.id,
      projectId: pAnalytics.id,
      summary: "Integrated Recharts on the frontend to visualize active system transactions.",
      technologies: ["React", "Recharts", "Node.js"],
      changes: "- Configured real-time mock web sockets server-side\n- Rendered interactive AreaChart for CPU logging\n- Resolved infinite memory re-render loop in useEffect lifecycle",
      githubUrl: "https://github.com/interntrack-org/telemetry-dash/commit/3e1c9d2",
      date: getRelativeDateStr(-1),
      status: "submitted",
    }
  });

  // Sophia's log
  const logSophia1 = await prisma.dailyLog.create({
    data: {
      id: "log-sophia-1",
      internId: sophia.id,
      projectId: pAuth.id,
      summary: "Connected Prisma ORM engine and structured the initial schema draft for User credentials.",
      technologies: ["TypeScript", "Prisma", "PostgreSQL"],
      changes: "- Generated Prisma schema models for User, Session, and Keys\n- Run DB migration against local dev environment\n- Seeded initial admin role accounts",
      githubUrl: "https://github.com/interntrack-org/auth-gateway/commit/1a2b3c4",
      date: getRelativeDateStr(-1),
      status: "reviewed",
    }
  });

  await prisma.mark.create({
    data: {
      internId: sophia.id,
      givenById: tlAlex.id,
      relatedLogId: logSophia1.id,
      score: 4,
      comment: "Clean Prisma models! Let's ensure indexes are added on the user emails for high speed queries.",
      date: getRelativeDateStr(-1),
    }
  });

  console.log('Seeding Tasks...');

  await prisma.task.createMany({
    data: [
      {
        id: "t-1",
        assignedToId: sam.id,
        assignedById: tlAlex.id,
        title: "Write integration tests for Checkout fields",
        description: "Cover shipping form validation with testing library. Verify invalid postcodes are blocked and display correct visual alerts.",
        dueDate: getRelativeDateStr(2),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
      },
      {
        id: "t-2",
        assignedToId: sam.id,
        assignedById: tlAlex.id,
        title: "Fix memory leak in checkout form render lifecycle",
        description: "Inspect the form dependency array in the useEffect. It causes unnecessary re-renders when changing focus across input panels.",
        dueDate: getRelativeDateStr(-1),
        priority: TaskPriority.HIGH,
        status: TaskStatus.DONE,
        completedAt: getRelativeDateStr(-1),
        score: 5,
        comment: "Excellent job Sam! You correctly isolated the dependency issue and wrapped the handler callback in useCallback."
      },
      {
        id: "t-3",
        assignedToId: liam.id,
        assignedById: tlAlex.id,
        title: "Establish robust Redis caching layer for queries",
        description: "Cache frequent telemetry aggregator fetches. Set keys to expire every 30 seconds to avoid serving extremely stale metrics.",
        dueDate: getRelativeDateStr(3),
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
      },
      {
        id: "t-4",
        assignedToId: sophia.id,
        assignedById: tlAlex.id,
        title: "Implement standard CSRF token protection headers",
        description: "Generate cryptographically secure cross-site tokens on login. Authenticate headers for all mutation transactions (POST/PUT/DELETE).",
        dueDate: getRelativeDateStr(1),
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
      }
    ],
  });

  console.log('Seeding Chat Messages...');

  await prisma.message.createMany({
    data: [
      {
        id: "msg-1",
        fromId: tlAlex.id,
        toId: sam.id,
        content: "Hey Sam, loved your checkout animation work! I noticed you resolved the hardcoded URL mistake. Great job fixing it quickly.",
        read: true,
        createdAt: new Date(getRelativeDateStr(-1) + "T10:15:00.000Z"),
      },
      {
        id: "msg-2",
        fromId: sam.id,
        toId: tlAlex.id,
        content: "Thanks Alex! Yes, I extracted it into our .env configuration. Looking forward to your thoughts on today's Stripe flow.",
        read: true,
        createdAt: new Date(getRelativeDateStr(-1) + "T10:45:00.000Z"),
      },
      {
        id: "msg-3",
        fromId: tlAlex.id,
        toId: sam.id,
        content: "Stripe flow looks solid. Let's touch base on the task reviews tomorrow morning.",
        read: false,
        createdAt: new Date(getRelativeDateStr(0) + "T09:00:00.000Z"),
      }
    ],
  });

  console.log('Seeding Discussion Threads...');

  const q1 = await prisma.question.create({
    data: {
      id: "q-1",
      internId: sam.id,
      title: "Mocking Stripe cards in testing suite?",
      content: "I'm writing integration tests for checkout fields. Is there a pre-configured utility to mock Stripe's token response, or should we query the sandbox directly using mock keys?",
      createdAt: new Date(getRelativeDateStr(-1) + "T14:30:00.000Z"),
    },
  });

  await prisma.reply.createMany({
    data: [
      {
        id: "r-1",
        questionId: q1.id,
        authorId: tlAlex.id,
        content: "Always mock the token responses locally so the unit test suite doesn't make active network requests. We have a stripeMock utility inside our tests/utils folder!",
        createdAt: new Date(getRelativeDateStr(-1) + "T15:00:00.000Z"),
      },
      {
        id: "r-2",
        questionId: q1.id,
        authorId: sam.id,
        content: "Perfect! Found the mock utility, importing it now. Tests are running green locally.",
        createdAt: new Date(getRelativeDateStr(-1) + "T16:15:00.000Z"),
      }
    ],
  });

  const q2 = await prisma.question.create({
    data: {
      id: "q-2",
      internId: liam.id,
      title: "Redis TTL expiry policies",
      content: "Should telemetry logs be cached using a standard volatile-lru policy, or should we configure keys with static TTL timeouts?",
      createdAt: new Date(getRelativeDateStr(-2) + "T11:00:00.000Z"),
    },
  });

  await prisma.reply.create({
    data: {
      id: "r-3",
      questionId: q2.id,
      authorId: tlAlex.id,
      content: "Static TTL timeouts of 30 seconds are ideal for our dashboards. Avoid volatile-lru here since telemetry capacity is not storage-constrained yet.",
      createdAt: new Date(getRelativeDateStr(-2) + "T11:45:00.000Z"),
    }
  });

  console.log('Database Seeding Completed Successfully! 🌱');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
