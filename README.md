# VanderBot Mobile 🐘

Native Android client for Oliver's AI workspace. Chat with Claude, create documents, build web pages, publish to GitHub Pages — all from your phone.

## Features

| Feature | Status |
|---|---|
| Streaming Claude chat | ✅ |
| Conversation history (Room DB) | ✅ |
| Image upload + vision analysis | ✅ |
| Document creation & editing | ✅ |
| Pitch deck generation | ✅ |
| Web page builder | ✅ |
| Publish to GitHub Pages | ✅ |
| File manager with versioning | ✅ |
| Google Drive sync | 🔜 Scaffolded |

## Setup

1. Open in Android Studio (Hedgehog+)
2. Copy `local.properties.example` → `local.properties`
3. Add your API keys:
   ```
   CLAUDE_API_KEY=sk-ant-xxxxx
   GITHUB_TOKEN=ghp_xxxxx
   ```
4. Build & run

## Architecture

```
vanderbot-mobile/
├── app/src/main/java/com/inkwell/vanderbot/
│   ├── VanderBotApp.kt          # Hilt application
│   ├── di/AppModule.kt          # Dependency injection
│   ├── data/
│   │   ├── api/ClaudeApi.kt     # Claude streaming + vision
│   │   └── api/GitHubApi.kt     # GitHub Pages publish
│   │   └── db/VanderBotDatabase.kt  # Room (conversations, messages, documents)
│   └── ui/
│       ├── MainActivity.kt      # Navigation + bottom bar
│       ├── theme/Theme.kt       # Inkwell dark palette
│       ├── screen/HomeScreen.kt  # Dashboard
│       ├── screen/ChatScreen.kt  # Streaming chat
│       ├── screen/FilesScreen.kt # Document manager
│       └── viewmodel/           # State management
```

## Stack

- **UI**: Jetpack Compose + Material 3
- **DI**: Hilt
- **DB**: Room (SQLite)
- **Network**: OkHttp + SSE streaming
- **Images**: Coil
- **API**: Claude (Anthropic) + GitHub REST

## Design

Inkwell dark theme matching ontological-theatre aesthetic:
- Background: `#0A0E1A`
- Cards: `#1A1F35` with glass effect
- Primary: `#00FF88` (green)
- Accent: `#4FACFE` (blue), `#AA66FF` (purple), `#00D4FF` (cyan)
