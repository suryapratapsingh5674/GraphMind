import { Router } from 'express'
import { createSession, listSessions, getSession, updateSessionTitle, deleteSession } from '../services/session.js'

const router = Router()

const DEV_USER_ID = process.env.DEV_USER_ID || 'dev-user-001'

router.post('/', async (req, res) => {
  try {
    const session = await createSession(DEV_USER_ID, req.body.title)
    res.status(201).json(session)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session', detail: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const sessions = await listSessions(DEV_USER_ID)
    res.json(sessions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to list sessions', detail: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const session = await getSession(DEV_USER_ID, req.params.id)
    if (!session) return res.status(404).json({ error: 'Session not found' })
    res.json(session)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session', detail: err.message })
  }
})

router.patch('/:id/title', async (req, res) => {
  try {
    const { title } = req.body
    if (!title || typeof title !== 'string') return res.status(400).json({ error: 'Title is required' })
    await updateSessionTitle(req.params.id, DEV_USER_ID, title.trim().slice(0, 80))
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update title', detail: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const session = await getSession(DEV_USER_ID, req.params.id)
    if (!session) return res.status(404).json({ error: 'Session not found' })
    await deleteSession(DEV_USER_ID, req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session', detail: err.message })
  }
})

export default router
