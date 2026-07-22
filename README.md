# Intern Monitoring System

A full-stack web application designed to monitor, manage, and evaluate intern activities inside a software development team.

The system helps managers and technical leads track intern progress, review daily work, provide feedback, monitor projects, and evaluate performance.

---

## 🚀 Features

### 👨‍💻 Intern

- Secure login system
- View assigned projects
- Update daily work progress
- Submit daily activities
- Track personal progress
- View feedback from technical leads
- Monitor performance ratings

### 👨‍🏫 Tech Lead

- Manage assigned interns
- Review intern progress
- Provide feedback
- Track project activities
- Identify mistakes and improvements
- Rate intern performance

### 👨‍💼 Manager

- View overall intern progress
- Monitor team performance
- Review reports
- Analyze intern development
- Manage system activities

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express.js
- TypeScript

### Database

- Supabase
- PostgreSQL
- Prisma ORM

### Tools

- Git & GitHub
- VS Code
- Postman

---

## 📂 Project Structure

monitor-app-1.1
├── .env
├── .env.example
├── package.json
├── package-lock.json
├── server.ts
├── vite.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── types.ts
│   ├── components/
│   │   ├── intern/
│   │   │   ├── AskTeamThread.tsx
│   │   │   ├── DailyLogForm.tsx
│   │   │   └── StartDayForm.tsx
│   │   ├── layout/
│   │   │   └── DashboardShell.tsx
│   │   └── techlead/
│   │       └── InternDetail.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── db/
│   │   └── prisma.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── supabaseClient.ts
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.tsx
│   │   ├── intern/
│   │   │   ├── InternDashboard.tsx
│   │   │   └── MyProjects.tsx
│   │   ├── manager/
│   │   │   └── ManagerOverview.tsx
│   │   └── techlead/
│   │       └── TeamOverview.tsx
│   ├── services/
│   │   └── api.ts
│   └── utils/
│       └── helpers.ts
├── dist/
└── node_modules/
