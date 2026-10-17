# GraphMind

**Graph-Powered Memory for AI Agents** — FalkorDB "Graph Hacks: Context for AI Agents" Hackathon

GraphMind is a chat assistant that remembers facts across conversations using a knowledge graph. When you tell it something, it saves structured memories as nodes and relationships in FalkorDB. In later sessions, it retrieves those memories and uses them to answer your questions.

---

## What it demonstrates

- **Persistent graph memory** — facts survive browser refresh and separate sessions
- **Cross-session retrieval** — ask about something you mentioned two conversations ago
- **Graph relationships** — `Chat App → USES → Socket.IO` — connected facts are discovered automatically
- **Evidence tracing** — see exactly which memories and relationships backed each answer
- **Real Cypher queries** — FalkorDB is part of the actual workflow, not decoration

---

## Quick setup

### 1. Start FalkorDB with Docker

```bash
docker run -p 6379:6379 falkordb/falkordb:latest
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Install dependencies

```bash
# In the server directory
cd server && npm install

# In the client directory
cd client && npm install
```

### 4. Run the application

Open two terminals:

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

The app runs at **http://localhost:5173**

---

## How it works internally

### The agent workflow (for each user message)

1. **Retrieve** — search FalkorDB for memory nodes matching keywords from the message
2. **Explore** — follow relationships to find connected facts
3. **Generate** — pass retrieved memories + message to Claude as context
4. **Extract** — Claude calls tools to save new facts as memory nodes
5. **Connect** — Claude calls tools to create typed relationships between nodes
6. **Respond** — return the answer plus which memories were used

### FalkorDB graph model

Every piece of information is a `Memory` node:

```cypher
(:Memory {
  id: "uuid",
  userId: "dev-user-001",
  type: "PROJECT",            -- PROJECT, TECHNOLOGY, CONCEPT, DECISION, PERSON, FACT
  name: "Chat App",           -- short unique name
  content: "A real-time MERN chat application",
  sourceSessionId: "session-uuid",
  createdAt: "2024-...",
  updatedAt: "2024-..."
})
```

Relationships connect memories:

```cypher
(:Memory {name: "Chat App"})-[:USES]->(:Memory {name: "Socket.IO"})
(:Memory {name: "Chat App"})-[:USES]->(:Memory {name: "Redis"})
(:Memory {name: "Redis"})-[:SUPPORTS]->(:Memory {name: "Socket.IO"})
```

Sessions and messages are also stored as graph nodes, so everything persists in FalkorDB.

### Example Cypher queries you can run

**Find all memories for a user:**
```cypher
MATCH (m:Memory {userId: 'dev-user-001'}) RETURN m ORDER BY m.updatedAt DESC
```

**Find memories about a topic:**
```cypher
MATCH (m:Memory {userId: 'dev-user-001'}) 
WHERE toLower(m.content) CONTAINS 'socket' 
RETURN m
```

**Follow relationships:**
```cypher
MATCH (m:Memory {name: 'Chat App'})-[r]->(connected:Memory) 
RETURN m.name, type(r), connected.name
```

**See all relationships:**
```cypher
MATCH (a:Memory)-[r]->(b:Memory) 
RETURN a.name, type(r), b.name
```

---

## Demo scenario (for the hackathon presentation)

**Session 1:**
> "I'm building a MERN chat app. It uses Socket.IO for real-time messaging. Redis is used to help Socket.IO work across multiple server instances."

*The agent saves: Chat App (PROJECT), Socket.IO (TECHNOLOGY), Redis (TECHNOLOGY)*
*Relationships: Chat App USES Socket.IO, Chat App USES Redis, Redis SUPPORTS Socket.IO*

**Session 2 (new browser tab, completely separate):**
> "How does my chat application handle communication across multiple servers?"

*The agent searches memories, finds Chat App → Redis → Socket.IO relationships, and answers from the saved facts.*

**Check the Memory Graph page** to see the nodes and edges visualized.

---

## Project structure

```
graphmind/
  client/src/
    components/
      Sidebar.jsx          -- session list + navigation
      ChatWindow.jsx       -- message bubbles + input
      MemoryPanel.jsx      -- evidence from graph memories
    pages/
      ChatPage.jsx         -- main chat layout
      MemoryGraphPage.jsx  -- ReactFlow graph visualization
    App.jsx
    main.jsx
  server/src/
    db/
      falkordb.js          -- connect to FalkorDB, export graph handle
    services/
      memory.js            -- all Cypher queries for memory CRUD
      session.js           -- session and message management
    agent/
      agent.js             -- LangChain agent with 4 graph tools
    routes/
      sessions.js          -- GET/POST /api/sessions
      chat.js              -- POST /api/sessions/:id/messages
      memories.js          -- GET /api/memories + /graph
    index.js               -- Express server
  .env.example
  README.md
```

---

## Technology choices

| What | Why |
|------|-----|
| FalkorDB | Graph database over Redis — stores memories as nodes, relationships as edges |
| `falkordb` npm | Official Node.js client — `createClient()` + `new Graph()` |
| LangChain JS | Agent framework — `@langchain/anthropic` + `@langchain/core/tools` |
| Claude claude-3-5-haiku-20241022 | Fast, cheap, great at tool calling |
| ReactFlow (`@xyflow/react`) | Graph visualization in the browser |
| Vite + React + Tailwind | Standard modern frontend stack |
| Express | Simple, well-understood backend |
