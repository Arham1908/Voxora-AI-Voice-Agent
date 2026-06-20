# Voxora AI - Voice Agent

A full-stack **AI Voice Agent** platform built with **Next.js** (frontend) and **Django** (backend). Features a real-time voice agent testing interface, business analytics dashboard, orders management, and dynamic menu configuration — designed for restaurant and retail automation.

## ✨ Features

### 🎙️ Voice Agent
- **Live Testing Page** — Test the AI voice agent in real-time directly from the browser
- **Conversation Playback** — Review voice agent interactions and responses
- **Agent Configuration** — Tune agent behavior, prompts, and response flow

### 📊 Dashboard & Analytics
- **Business Overview** — Key metrics and KPIs at a glance
- **Conversation Analytics** — Call volume, success rate, drop-off tracking
- **Performance Charts** — Visual trends over time (daily/weekly/monthly)

### 🛒 Orders Management
- **Orders Table** — Full CRUD operations on incoming orders
- **Status Tracking** — Real-time order status updates (pending, confirmed, completed)
- **Filtering & Search** — Sort and filter orders by date, status, and customer

### 🍽️ Menu Management
- **Dynamic Menu Builder** — Add, edit, and remove menu items
- **Category Management** — Organize items by category
- **Live Sync** — Changes reflect immediately in the voice agent responses via Django API

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Django, Django REST Framework |
| Auth | JWT Authentication |
| State Management | React Context / Zustand |
| Charts | Recharts / Chart.js |
| API | RESTful API (Django backend) |

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│        Next.js Frontend         │
│  Voice Test │ Dashboard │ Menu  │
└──────────────┬──────────────────┘
               │ REST API (JWT)
┌──────────────▼──────────────────┐
│         Django Backend          │
│  Voice Agent │ Orders │ Menu    │
└─────────────────────────────────┘
```

## 🚀 Getting Started

### Frontend

```bash
git clone https://github.com/HaMZAAsif043/voxora-ai-voice.git
cd voxora-ai-voice

npm install
npm run dev
```

### Backend (Django)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Environment Variables

Create a `.env.local` in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_VOICE_AGENT_URL=your_voice_agent_endpoint
```

## 📁 Project Structure

```
voxora-ai-voice/
├── app/
│   ├── dashboard/        # Analytics & overview
│   ├── voice-test/       # Live voice agent testing
│   ├── orders/           # Orders table & management
│   └── menu/             # Menu management UI
├── components/
│   ├── charts/           # Analytics charts
│   ├── tables/           # Orders & menu tables
│   └── voice/            # Voice agent interface
├── lib/
│   └── api/              # Django API integration
└── types/                # TypeScript definitions
```

## 📸 Pages Overview

| Page | Description |
|------|-------------|
| `/dashboard` | Analytics, KPIs, conversation stats |
| `/voice-test` | Live voice agent interaction testing |
| `/orders` | Orders table with status management |
| `/menu` | Menu items and category management |

---

Built at [Voxora AI](https://voxora.ai) — AI-powered business automation
