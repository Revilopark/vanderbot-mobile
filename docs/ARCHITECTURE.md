# Vanderbot 2.0 - Trinity Graph + Kimi Bot Claw Integration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD PLATFORM                     │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Cloud Run  │    │   Cloud Run  │    │   Cloud Run  │  │
│  │  Vanderbot   │◄──►│  MCP Client  │◄──►│  IAM MCP     │  │
│  │   Next.js    │    │   (SSE)      │    │  (External)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                              │    │
│         │                                              │    │
│  ┌──────┴──────┐                              ┌────────┴─┐  │
│  │  Cloud SQL  │                              │ Firestore│  │
│  │  (Postgres) │                              │ (Graph)  │  │
│  └─────────────┘                              └──────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   Kimi Bot Claw    │
                    │  (OpenClaw Agent)  │
                    └────────────────────┘
```

## Components

### 1. Vanderbot App (Next.js)
- Mobile-first PWA
- IAM-aware UI
- Real-time chat with memory
- Artifact creation

### 2. MCP Client (Node.js)
- SSE connection to IAM MCP
- Tool proxy for permission checks
- Context retrieval
- WebSocket for real-time updates

### 3. IAM MCP (External)
- Identity & Access Management
- Permission verification
- User context
- Already deployed at: `https://iam-mcp-xxx-uc.a.run.app/sse`

### 4. Trinity Graph (Firestore)
- Knowledge graph storage
- Project memory
- Decision tracking
- Artifact provenance

### 5. Kimi Bot Claw (OpenClaw)
- AI agent orchestration
- Multi-agent collaboration
- Tool use via MCP

## Environment Variables

```bash
# App
IAM_MCP_URL=https://iam-mcp-xxx-uc.a.run.app/sse
MCP_CLIENT_URL=https://vanderbot-mcp-xxx-uc.a.run.app
TRINITY_GRAPH_URL=https://firestore.googleapis.com/...
KIMI_BOT_CLAW_URL=https://...

# Database
DATABASE_URL=postgresql://...
FIRESTORE_PROJECT_ID=vanderbot-2
```

## Deployment

```bash
# Full stack deploy
./scripts/deploy-gcloud.sh

# Or step by step:
gcloud builds submit --tag gcr.io/$PROJECT_ID/vanderbot:latest .
gcloud run deploy vanderbot --image gcr.io/$PROJECT_ID/vanderbot:latest
```

## API Endpoints

### App (Next.js)
- `GET /` - Main app
- `GET /api/health` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/context` - Get IAM context
- `POST /api/chat` - Chat with AI
- `POST /api/artifacts` - Create artifact

### MCP Client
- `GET /health` - Health check
- `POST /mcp/:tool` - Call MCP tool
- `GET /context/:userId` - Get user context
- `POST /check` - Check permissions

### IAM MCP (External)
- `GET /sse` - SSE endpoint
- `POST /tools/:tool` - Tool calls

## Trinity Graph Schema

```typescript
interface Node {
  id: string;
  type: 'project' | 'decision' | 'artifact' | 'memory' | 'user';
  data: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  visibility: 'private' | 'team' | 'cohort' | 'public';
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'depends_on' | 'influences' | 'created_by' | 'references';
  weight: number;
}
```
