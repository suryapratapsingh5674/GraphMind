import { Router } from 'express'
import { getAllMemories, getMemoryById, getGraphData } from '../services/memory.js'

const router = Router()

const DEV_USER_ID = process.env.DEV_USER_ID || 'dev-user-001'

router.get('/', async (req, res) => {
  try {
    const memories = await getAllMemories(DEV_USER_ID)
    res.json(memories)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve memories', detail: err.message })
  }
})

router.get('/graph', async (req, res) => {
  try {
    const data = await getGraphData(DEV_USER_ID)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve graph data', detail: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const memory = await getMemoryById(DEV_USER_ID, req.params.id)
    if (!memory) return res.status(404).json({ error: 'Memory not found' })
    res.json(memory)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve memory', detail: err.message })
  }
})

export default router
