# Vanderbot 2.0 - Mobile UI

AI-native practicum OS for learning-by-building. Mobile-first responsive PWA.

## Features

- **Home / Command Center** - Resume work, active projects, open decisions, recent artifacts
- **Projects** - Project workspace with progress tracking
- **Chat** - Conversational AI with memory disclosure
- **Create** - Artifact generation hub
- **Files** - Project knowledge base
- **IAM Awareness Panel** - Bottom sheet for context disclosure

## Design System

- Dark mode first (deep navy/graphite base)
- Electric violet accent (#6366f1)
- High contrast text hierarchy
- Mobile-optimized tap targets
- Safe area support for iOS/Android

## Tech Stack

- Next.js 16 + React + TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide Icons
- PWA ready

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Static export goes to `dist/` folder.

## Screens

| Screen | Description |
|--------|-------------|
| Home | Command center with resume card, mode chips, active projects |
| Projects | Project list with progress bars and metadata |
| Chat | Conversational interface with memory sources |
| Create | Artifact type selector and quick create |
| Files | File upload and project knowledge base |

## Architecture

Based on Vanderbot 2.0 Master Spec:
- Private by default
- Project-first organization
- Memory visibility and sourcing
- Action approval flows
- Rights & provenance ready
# Deploy trigger - 2026-06-18-12:45:52
