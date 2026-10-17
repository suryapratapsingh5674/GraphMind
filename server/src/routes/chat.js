import { Router } from 'express'
import { runAgent } from '../agent/agent.js'
import { addMessage, getSession } from '../services/session.js'

const router = Router()

const DEV_USER_ID = process.env.DEV_USER_ID || 'dev-user-001'

router.post('/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params
  const { content } = req.body

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required' })
  }

  const session = await getSession(DEV_USER_ID, sessionId)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  await addMessage(sessionId, DEV_USER_ID, 'user', content.trim(), [])

  try {
    const { answer, evidence } = await runAgent(
      DEV_USER_ID,
      sessionId,
      content.trim(),
      session.messages
    )

    const assistantMessage = await addMessage(sessionId, DEV_USER_ID, 'assistant', answer, evidence)

    res.json({
      message: assistantMessage,
      evidence,
    })
  } catch (err) {
    console.error('Agent error:', err)
    const errorMsg = await addMessage(
      sessionId, DEV_USER_ID, 'assistant',
      'I ran into an error processing your message. Please try again.',
      []
    )
    res.status(500).json({ error: 'Agent failed', detail: err.message, message: errorMsg })
  }
})

export default router
