import { getGraph } from '../db/falkordb.js'
import { v4 as uuidv4 } from 'uuid'

export async function createSession(userId, title) {
  const graph = getGraph()
  const id = uuidv4()
  const now = new Date().toISOString()

  await graph.query(
    `CREATE (s:Session {
      id: $id,
      userId: $userId,
      title: $title,
      createdAt: $now,
      updatedAt: $now
    })`,
    { params: { id, userId, title: title || 'New Chat', now } }
  )

  return { id, userId, title: title || 'New Chat', createdAt: now, updatedAt: now, messages: [] }
}

export async function listSessions(userId) {
  const graph = getGraph()
  const result = await graph.query(
    `MATCH (s:Session {userId: $userId}) RETURN s ORDER BY s.updatedAt DESC`,
    { params: { userId } }
  )

  if (!result.data) return []
  return result.data.map(row => row['s']?.properties).filter(Boolean)
}

export async function getSession(userId, sessionId) {
  const graph = getGraph()
  const result = await graph.query(
    `MATCH (s:Session {id: $id, userId: $userId}) RETURN s`,
    { params: { id: sessionId, userId } }
  )

  if (!result.data || result.data.length === 0) return null
  const session = result.data[0]['s']?.properties
  if (!session) return null

  const messages = await getSessionMessages(sessionId)
  return { ...session, messages }
}

export async function addMessage(sessionId, userId, role, content, evidence) {
  const graph = getGraph()
  const id = uuidv4()
  const now = new Date().toISOString()

  await graph.query(
    `CREATE (msg:Message {
      id: $id,
      sessionId: $sessionId,
      role: $role,
      content: $content,
      evidence: $evidence,
      createdAt: $now
    })`,
    { params: { id, sessionId, role, content, evidence: JSON.stringify(evidence || []), now } }
  )

  await graph.query(
    `MATCH (s:Session {id: $sessionId}) SET s.updatedAt = $now`,
    { params: { sessionId, now } }
  )

  return { id, sessionId, role, content, evidence: evidence || [], createdAt: now }
}

export async function updateSessionTitle(sessionId, userId, title) {
  const graph = getGraph()
  await graph.query(
    `MATCH (s:Session {id: $sessionId, userId: $userId}) SET s.title = $title`,
    { params: { sessionId, userId, title } }
  )
}

async function getSessionMessages(sessionId) {
  const graph = getGraph()
  const result = await graph.query(
    `MATCH (msg:Message {sessionId: $sessionId}) RETURN msg ORDER BY msg.createdAt ASC`,
    { params: { sessionId } }
  )

  if (!result.data) return []
  return result.data.map(row => {
    const msg = row['msg']?.properties
    if (!msg) return null
    return {
      ...msg,
      evidence: (() => {
        try { return JSON.parse(msg.evidence || '[]') } catch { return [] }
      })()
    }
  }).filter(Boolean)
}

export async function deleteSession(userId, sessionId) {
  const graph = getGraph()
  // Delete all messages belonging to the session first
  await graph.query(
    `MATCH (msg:Message {sessionId: $sessionId}) DELETE msg`,
    { params: { sessionId } }
  )
  // Delete the session node itself
  await graph.query(
    `MATCH (s:Session {id: $sessionId, userId: $userId}) DELETE s`,
    { params: { sessionId, userId } }
  )
}
