#!/bin/bash
# Vanderbot 2.0 - Full Stack Deployment Script
# Deploys: Next.js App, MCP Client, Trinity Graph, Kimi Bot Claw

set -e

PROJECT_ID="${GCLOUD_PROJECT_ID:-vanderbot-2}"
REGION="${GCLOUD_REGION:-us-central1}"
APP_NAME="vanderbot"
IAM_MCP_URL="${IAM_MCP_URL:-https://iam-mcp-xxx-uc.a.run.app/sse}"

echo "🚀 Vanderbot 2.0 Full Stack Deployment"
echo "========================================"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "IAM MCP: $IAM_MCP_URL"
echo ""

# ─── Prerequisites Check ───────────────────────────────────────────

echo "📋 Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Installing..."
    curl -s https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-arm.tar.gz | tar -xzf - -C /tmp
    export PATH="/tmp/google-cloud-sdk/bin:$PATH"
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "🔑 Please authenticate with gcloud:"
    gcloud auth login
fi

gcloud config set project "$PROJECT_ID" 2>/dev/null || true
gcloud config set run/region "$REGION" 2>/dev/null || true

echo "✅ Prerequisites OK"
echo ""

# ─── Build & Push Container ────────────────────────────────────────

echo "📦 Building container image..."

cd "$(dirname "$0")/.."

# Create production Dockerfile if not exists
if [ ! -f Dockerfile ]; then
    cat > Dockerfile << 'DOCKEREOF'
# Multi-stage build for Vanderbot 2.0
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
DOCKEREOF
fi

# Enable standalone output
cat > next.config.ts << 'CONFIGEOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
CONFIGEOF

# Build and push
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$APP_NAME:latest" .

echo "✅ Container built and pushed"
echo ""

# ─── Deploy to Cloud Run ───────────────────────────────────────────

echo "🚀 Deploying to Cloud Run..."

gcloud run deploy "$APP_NAME" \
    --image "gcr.io/$PROJECT_ID/$APP_NAME:latest" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars="IAM_MCP_URL=$IAM_MCP_URL" \
    --set-env-vars="NEXT_PUBLIC_IAM_MCP_URL=$IAM_MCP_URL" \
    --set-env-vars="NODE_ENV=production" \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 1

APP_URL=$(gcloud run services describe "$APP_NAME" --region "$REGION" --format='value(status.url)')

echo "✅ App deployed: $APP_URL"
echo ""

# ─── Deploy MCP Client Service ─────────────────────────────────────

echo "🔗 Deploying MCP Client..."

cat > mcp-client/Dockerfile << 'MCPEOF'
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install @modelcontextprotocol/sdk express ws
COPY . .
EXPOSE 8080
CMD ["node", "mcp-client.js"]
MCPEOF

cat > mcp-client/mcp-client.js << 'JSEOF'
const { Client } = require('@modelcontextprotocol/sdk');
const express = require('express');
const WebSocket = require('ws');

const IAM_MCP_URL = process.env.IAM_MCP_URL || 'https://iam-mcp-xxx-uc.a.run.app/sse';
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());

// MCP Client instance
let mcpClient = null;

async function connectMCP() {
    try {
        mcpClient = new Client({ transport: 'sse' });
        await mcpClient.connect(IAM_MCP_URL);
        console.log('✅ MCP Connected:', IAM_MCP_URL);
        
        // List available tools
        const tools = await mcpClient.listTools();
        console.log('🔧 Available tools:', tools.map(t => t.name));
        
        return mcpClient;
    } catch (err) {
        console.error('❌ MCP Connection failed:', err.message);
        return null;
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        mcpConnected: !!mcpClient,
        iamMcpUrl: IAM_MCP_URL 
    });
});

// Proxy MCP tool calls
app.post('/mcp/:tool', async (req, res) => {
    if (!mcpClient) {
        return res.status(503).json({ error: 'MCP not connected' });
    }
    try {
        const result = await mcpClient.callTool(req.params.tool, req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get IAM context for user
app.get('/context/:userId', async (req, res) => {
    if (!mcpClient) {
        return res.status(503).json({ error: 'MCP not connected' });
    }
    try {
        const context = await mcpClient.callTool('get_user_context', {
            userId: req.params.userId
        });
        res.json(context);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify permissions
app.post('/check', async (req, res) => {
    if (!mcpClient) {
        return res.status(503).json({ error: 'MCP not connected' });
    }
    try {
        const result = await mcpClient.callTool('check_permission', req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 MCP Client running on port ${PORT}`);
    connectMCP();
});
JSEOF

gcloud builds submit --tag "gcr.io/$PROJECT_ID/$APP_NAME-mcp:latest" ./mcp-client

gcloud run deploy "$APP_NAME-mcp" \
    --image "gcr.io/$PROJECT_ID/$APP_NAME-mcp:latest" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars="IAM_MCP_URL=$IAM_MCP_URL" \
    --memory 512Mi \
    --cpu 1

MCP_URL=$(gcloud run services describe "$APP_NAME-mcp" --region "$REGION" --format='value(status.url)')

echo "✅ MCP Client deployed: $MCP_URL"
echo ""

# ─── Update App with MCP URL ───────────────────────────────────────

echo "🔄 Updating app with MCP client URL..."

gcloud run services update "$APP_NAME" \
    --region "$REGION" \
    --set-env-vars="MCP_CLIENT_URL=$MCP_URL"

echo "✅ App updated"
echo ""

# ─── Summary ───────────────────────────────────────────────────────

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "App URL:        $APP_URL"
echo "MCP Client:     $MCP_URL"
echo "IAM MCP:        $IAM_MCP_URL"
echo ""
echo "Test endpoints:"
echo "  curl $APP_URL/health"
echo "  curl $MCP_URL/health"
echo ""
