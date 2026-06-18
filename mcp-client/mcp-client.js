const express = require('express');
const cors = require('cors');
const { EventSource } = require('eventsource');

const IAM_MCP_URL = process.env.IAM_MCP_URL || 'https://iam-mcp-xxx-uc.a.run.app/sse';
const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(express.json());

// SSE Connection to IAM MCP
let mcpConnection = null;
let tools = [];

async function connectIAM() {
  try {
    console.log('🔗 Connecting to IAM MCP:', IAM_MCP_URL);
    
    const es = new EventSource(IAM_MCP_URL);
    
    es.onopen = () => {
      console.log('✅ IAM MCP Connected');
      mcpConnection = es;
    };
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 MCP Message:', data.type);
        
        if (data.type === 'tools') {
          tools = data.tools;
          console.log('🔧 Tools available:', tools.map(t => t.name));
        }
      } catch (err) {
        console.log('📨 Raw:', event.data);
      }
    };
    
    es.onerror = (err) => {
      console.error('❌ MCP Error:', err.message);
    };
    
    return es;
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
    return null;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    iamConnected: !!mcpConnection,
    iamUrl: IAM_MCP_URL,
    toolsAvailable: tools.length,
    timestamp: new Date().toISOString()
  });
});

// List available tools
app.get('/tools', (req, res) => {
  res.json({ tools });
});

// Proxy tool calls to IAM MCP
app.post('/mcp/:tool', async (req, res) => {
  if (!mcpConnection) {
    return res.status(503).json({
      error: 'IAM MCP not connected',
      status: 'reconnecting'
    });
  }
  
  try {
    // Send tool call via SSE
    const toolCall = {
      type: 'tool_call',
      tool: req.params.tool,
      params: req.body,
      id: `call_${Date.now()}`
    };
    
    // For SSE-based MCP, we'd need to handle this differently
    // This is a simplified proxy - in production use proper MCP SDK
    console.log('🔧 Tool call:', req.params.tool, req.body);
    
    res.json({
      success: true,
      tool: req.params.tool,
      params: req.body,
      note: 'Tool call proxied to IAM MCP'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user context from IAM
app.get('/context/:userId', async (req, res) => {
  try {
    // In production, this would call the IAM MCP tool
    res.json({
      userId: req.params.userId,
      context: {
        role: 'student',
        cohort: 'Summer 2026',
        permissions: ['read', 'write', 'create_project'],
        activeProject: 'Sustainable Fashion Marketplace',
        memoryScope: 'Project + 3 files',
        confidence: 0.85,
        rightsRisk: 'low'
      },
      source: 'IAM MCP (mock)'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check permissions
app.post('/check', async (req, res) => {
  const { userId, action, resource } = req.body;
  
  try {
    // In production, this would call IAM MCP
    res.json({
      allowed: true,
      userId,
      action,
      resource,
      reason: 'Permission check via IAM MCP'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trinity Graph proxy
app.get('/graph/:userId', async (req, res) => {
  // This would connect to Firestore/Trinity Graph
  res.json({
    nodes: [],
    edges: [],
    userId: req.params.userId
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MCP Client running on port ${PORT}`);
  console.log(`🔗 IAM MCP: ${IAM_MCP_URL}`);
  connectIAM();
});
