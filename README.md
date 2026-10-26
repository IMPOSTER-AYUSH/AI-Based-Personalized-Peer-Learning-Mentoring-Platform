# SkillSwap ⚡
> **AI Based Personalized Peer Learning & Mentoring Platform**
> *"Learn Anything. Teach What You Love. Exchange skills instead of money through AI-powered matching."*

SkillSwap is a production-grade, full-stack MERN web application enabling reciprocal peer-to-peer knowledge exchange. Peers teach crafts they excel in and learn skills they desire through AI-powered bilateral compatibility matching, in-browser WebRTC video mentoring, real-time messaging, calendar scheduling, gamified XP, and skill communities.

---

## 🌟 Quick Demo Logins
Pre-seeded with realistic data, active connections, conversations, and sessions:

| Role | Email | Password | Details |
|---|---|---|---|
| **Demo Learner** | `demo@skillswap.com` | `Demo@1234` | Full profile, Level 3, 180 SP, active chats, scheduled sessions, goals |
| **Platform Admin** | `admin@skillswap.com` | `Admin@1234` | Head of Community, Level 9, 500 SP, full access to `/admin` governance |

*Or click the **1-Click Demo Login** buttons on the `/auth` page to sign in immediately.*

---

## 🎨 Design System & Aesthetics
- **Typography**: `Plus Jakarta Sans` for clean, legible body text; `Outfit` for energetic, modern geometric headings.
- **Color Palette**:
  - Primary Brand: Emerald & Mint accents (`#10b981`, `#059669`, `#4ade80`) symbolizing continuous growth and intellectual curiosity.
  - Deep Dark Mode: Rich slate tones (`#0a0f18`, `#0f172a`, `#1e293b`) with luminous neon accents.
- **Pill Philosophy**: Floating cylindrical pill-shaped navbar (`border-radius: 9999px`) with glassmorphism blur and subtle box-shadows that shrinks smoothly on scroll. Mobile uses a post-login floating bottom pill navigation bar.
- **Micro-Animations**: Powered by `Framer Motion` for smooth spring transitions, layout morphing, active indicators, and modal reveals.

---

## 🚀 Key Features

1. **AI-Powered Matching Engine (Groq openai/gpt-oss-120b)**:
   - Deep semantic compatibility scoring comparing teaching skills against learning wishlists.
   - Generates natural language compatibility rationale.
   - Built-in rule-based fallback heuristic so matching works seamlessly even offline or without API keys.

2. **Real-Time WebRTC Video Learning**:
   - Zero-latency in-browser video calling using WebRTC and Socket.io signaling.
   - Screen sharing, camera toggle, and microphone mute.
   - Public Google STUN servers with zero paid third-party dependencies.

3. **Socket.io Real-Time Messenger**:
   - Real-time chat with online presence indicators and typing notifications.
   - In-chat voice notes recorded via `MediaRecorder` and hosted on Cloudinary.
   - File attachments, images, and read receipts.
   - Embedded **Groq AI Study Assistant** panel in chat for instant explanations.
   - 1-Click "Schedule Session" directly from inside the chat thread.

4. **Smart Scheduling & Calendar Sync**:
   - Monthly, weekly, and daily interactive views.
   - Automatic 1-Click "Add to Google Calendar" links.
   - Universal `.ics` calendar export for Apple Calendar, Outlook, and mobile devices.

5. **Gamification & Progress Tracking**:
   - Skill Points (SP) liquid economy: 100 SP welcome bonus for every new member.
   - XP, levels, learning hours, and teaching hours tracking.
   - Visual analytics with `Recharts` (activity areas, skill mastery radar).
   - Achievement Badge Vault with locked and unlocked visual states.
   - Interactive learning goals with milestone task checkboxes.
   - Groq-generated weekly learning summaries.

6. **Skill Guilds & Community Feed**:
   - 6 vibrant communities (Web Dev, Polyglot Languages, Acoustic Music, UI/UX Design, Data Science & AI, Calisthenics).
   - Discussion feed with text, images, comments, and emoji reactions (likes, hearts, fires).
   - Live workshops and speed-exchange events with 1-click free RSVP.
   - 30-Day community challenges and public leaderboards.

7. **Admin Governance Command Center (`/admin`)**:
   - Platform telemetry: total users, sessions, guilds, and reports.
   - User moderation: promote to admin, demote, or ban accounts.
   - Skill catalog management: CRUD operations on platform skills.
   - Educational blog publishing and moderation report resolution.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router 6, Tailwind CSS, Framer Motion, Axios, Socket.io Client, Recharts, Lucide React, React Hot Toast, React Helmet Async.
- **Backend**: Node.js, Express, MongoDB Atlas, Mongoose, Socket.io, JWT, bcryptjs, Passport Google OAuth 2.0, Multer, Cloudinary, Helmet, CORS, Express Rate Limit, Zod.
- **AI**: Groq SDK (`openai/gpt-oss-120b`).

---

## 💻 Local Setup & Execution

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas or local MongoDB instance

### 2. Backend Setup
```bash
cd server
npm install
npm run seed     # Populates 22 users, demo accounts, sessions, chats, communities
npm run dev      # Starts API server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

Visit `http://localhost:5173` in your browser!

---

## 🌐 Deployment Configuration

- **Frontend (Vercel)**:
  - Configuration in `client/vercel.json` with SPA routing rules.
  - Set Environment Variable: `VITE_API_URL=https://your-render-backend.onrender.com/api`
- **Backend (Render)**:
  - Blueprint included in root `render.yaml`.
  - Set Environment Variables: `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `CLOUDINARY_*`, `CLIENT_URL`.
- **Database (MongoDB Atlas)**:
  - Fully compatible with MongoDB Atlas M0 free tier clusters.
