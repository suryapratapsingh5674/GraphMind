import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectToFalkorDB } from './db/falkordb.js'
import sessionsRouter from './routes/sessions.js'
import chatRouter from './routes/chat.js'
import memoriesRouter from './routes/memories.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/sessions', sessionsRouter)
app.use('/api/sessions', chatRouter)
app.use('/api/memories', memoriesRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

async function start() {
  try {
    await connectToFalkorDB()
    app.listen(PORT, () => {
      console.log(`GraphMind server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
