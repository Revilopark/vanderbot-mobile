const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const neo4j = require('neo4j-driver');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Neo4j Aura connection (will use provided credentials)
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://aura.neo4j.io';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || '';

let driver = null;

async function connectNeo4j() {
  try {
    if (!NEO4J_PASSWORD) {
      console.log('⚠️  No Neo4j password set, using in-memory mode');
      return null;
    }
    
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
    );
    
    await driver.verifyConnectivity();
    console.log('✅ Neo4j connected:', NEO4J_URI);
    
    // Create constraints
    const session = driver.session();
    try {
      await session.run(`
        CREATE CONSTRAINT user_id IF NOT EXISTS
        FOR (u:User) REQUIRE u.id IS UNIQUE
      `);
      await session.run(`
        CREATE CONSTRAINT project_id IF NOT EXISTS
        FOR (p:Project) REQUIRE p.id IS UNIQUE
      `);
      await session.run(`
        CREATE CONSTRAINT memory_id IF NOT EXISTS
        FOR (m:Memory) REQUIRE m.id IS UNIQUE
      `);
      console.log('✅ Constraints created');
    } finally {
      await session.close();
    }
    
    return driver;
  } catch (err) {
    console.error('❌ Neo4j connection failed:', err.message);
    return null;
  }
}

// In-memory fallback
const memory = {
  nodes: new Map(),
  edges: new Map()
};

// ─── Health Check ─────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    neo4j: !!driver,
    timestamp: new Date().toISOString()
  });
});

// ─── Node Operations ──────────────────────────────────────────────

app.post('/node', async (req, res) => {
  const { type, data, visibility = 'private' } = req.body;
  const id = uuidv4();
  
  try {
    if (driver) {
      const session = driver.session();
      try {
        await session.run(`
          CREATE (n:${type} {id: $id, data: $data, visibility: $visibility, createdAt: datetime()})
          RETURN n
        `, { id, data: JSON.stringify(data), visibility });
      } finally {
        await session.close();
      }
    } else {
      memory.nodes.set(id, { id, type, data, visibility, createdAt: new Date() });
    }
    
    res.json({ id, type, data, visibility });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/node/:id', async (req, res) => {
  try {
    if (driver) {
      const session = driver.session();
      try {
        const result = await session.run(`
          MATCH (n {id: $id})
          RETURN n
        `, { id: req.params.id });
        
        if (result.records.length === 0) {
          return res.status(404).json({ error: 'Node not found' });
        }
        
        const node = result.records[0].get('n').properties;
        res.json({ ...node, data: JSON.parse(node.data || '{}') });
      } finally {
        await session.close();
      }
    } else {
      const node = memory.nodes.get(req.params.id);
      if (!node) return res.status(404).json({ error: 'Node not found' });
      res.json(node);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Edge Operations ──────────────────────────────────────────────

app.post('/edge', async (req, res) => {
  const { source, target, type, weight = 1 } = req.body;
  const id = uuidv4();
  
  try {
    if (driver) {
      const session = driver.session();
      try {
        await session.run(`
          MATCH (a {id: $source}), (b {id: $target})
          CREATE (a)-[r:${type} {id: $id, weight: $weight, createdAt: datetime()}]->(b)
          RETURN r
        `, { source, target, id, weight });
      } finally {
        await session.close();
      }
    } else {
      memory.edges.set(id, { id, source, target, type, weight, createdAt: new Date() });
    }
    
    res.json({ id, source, target, type, weight });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Query ────────────────────────────────────────────────────────

app.post('/query', async (req, res) => {
  const { cypher, params = {} } = req.body;
  
  try {
    if (driver) {
      const session = driver.session();
      try {
        const result = await session.run(cypher, params);
        const records = result.records.map(r => {
          const obj = {};
          r.keys.forEach(key => {
            const value = r.get(key);
            obj[key] = value.properties || value;
          });
          return obj;
        });
        res.json({ records });
      } finally {
        await session.close();
      }
    } else {
      // Simple in-memory query fallback
      res.json({ 
        records: Array.from(memory.nodes.values()),
        note: 'In-memory mode - Neo4j not connected'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Project Context ──────────────────────────────────────────────

app.get('/context/:userId', async (req, res) => {
  try {
    if (driver) {
      const session = driver.session();
      try {
        const result = await session.run(`
          MATCH (u:User {id: $userId})-[:HAS_PROJECT]->(p:Project)
          OPTIONAL MATCH (p)-[:HAS_MEMORY]->(m:Memory)
          RETURN u, p, collect(m) as memories
        `, { userId: req.params.userId });
        
        if (result.records.length === 0) {
          return res.json({ user: null, project: null, memories: [] });
        }
        
        const record = result.records[0];
        res.json({
          user: record.get('u').properties,
          project: record.get('p').properties,
          memories: record.get('memories').map(m => m.properties)
        });
      } finally {
        await session.close();
      }
    } else {
      res.json({
        user: { id: req.params.userId },
        project: null,
        memories: [],
        note: 'In-memory mode'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────

async function start() {
  await connectNeo4j();
  
  app.listen(PORT, () => {
    console.log(`🚀 Trinity Graph running on port ${PORT}`);
    console.log(`📊 Neo4j: ${driver ? 'Connected' : 'In-memory mode'}`);
  });
}

start().catch(console.error);
