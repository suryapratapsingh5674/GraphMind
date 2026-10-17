import { getGraph } from '../db/falkordb.js'
import { v4 as uuidv4 } from 'uuid'

export async function retrieveMemories(userId, query, limit = 10) {
  const graph = getGraph()

  const keywords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 5)

  if (keywords.length === 0) {
    const result = await graph.query(
      `MATCH (m:Memory {userId: $userId}) RETURN m ORDER BY m.updatedAt DESC LIMIT 10`,
      { params: { userId } }
    )
    return formatMemoryResults(result)
  }

  const conditions = keywords.map((_, i) => `toLower(m.content) CONTAINS $kw${i}`).join(' OR ')
  const params = { userId }
  keywords.forEach((kw, i) => { params[`kw${i}`] = kw })

  const result = await graph.query(
    `MATCH (m:Memory {userId: $userId}) WHERE ${conditions} RETURN m ORDER BY m.updatedAt DESC LIMIT ${limit}`,
    { params }
  )

  return formatMemoryResults(result)
}

export async function retrieveConnectedMemories(userId, memoryIds) {
  if (!memoryIds || memoryIds.length === 0) return []

  const graph = getGraph()

  const results = []
  for (const memId of memoryIds.slice(0, 5)) {
    const result = await graph.query(
      `MATCH (m:Memory {id: $memId, userId: $userId})-[r]-(connected:Memory {userId: $userId})
       RETURN m, r, connected LIMIT 10`,
      { params: { memId, userId } }
    )

    for (const row of (result.data || [])) {
      const rel = row['r']
      const connected = row['connected']
      if (connected && connected.properties) {
        results.push({
          ...connected.properties,
          relationshipType: rel?.relationshipType || 'RELATED_TO',
          connectedFrom: memId,
        })
      }
    }
  }

  return results
}

export async function saveMemories(userId, sessionId, memories) {
  const graph = getGraph()
  const saved = []

  for (const mem of memories) {
    const existing = await findExistingMemory(userId, mem.name, mem.type)

    if (existing) {
      if (existing.content !== mem.content) {
        await graph.query(
          `MATCH (m:Memory {id: $id}) SET m.content = $content, m.updatedAt = $updatedAt`,
          { params: { id: existing.id, content: mem.content, updatedAt: new Date().toISOString() } }
        )
        saved.push({ ...existing, content: mem.content, action: 'updated' })
      } else {
        saved.push({ ...existing, action: 'unchanged' })
      }
    } else {
      const newId = uuidv4()
      const now = new Date().toISOString()

      await graph.query(
        `CREATE (m:Memory {
          id: $id,
          userId: $userId,
          type: $type,
          name: $name,
          content: $content,
          sourceSessionId: $sessionId,
          createdAt: $now,
          updatedAt: $now
        })`,
        { params: { id: newId, userId, type: mem.type, name: mem.name, content: mem.content, sessionId, now } }
      )
      saved.push({ id: newId, ...mem, action: 'created' })
    }
  }

  return saved
}

export async function saveRelationships(userId, relationships) {
  const graph = getGraph()

  for (const rel of relationships) {
    const fromMem = await findExistingMemory(userId, rel.fromName, null)
    const toMem = await findExistingMemory(userId, rel.toName, null)

    if (!fromMem || !toMem) continue

    const existing = await graph.query(
      `MATCH (a:Memory {id: $fromId})-[r:${sanitizeRelType(rel.type)}]->(b:Memory {id: $toId}) RETURN r`,
      { params: { fromId: fromMem.id, toId: toMem.id } }
    )

    if (!existing.data || existing.data.length === 0) {
      await graph.query(
        `MATCH (a:Memory {id: $fromId}), (b:Memory {id: $toId})
         CREATE (a)-[:${sanitizeRelType(rel.type)}]->(b)`,
        { params: { fromId: fromMem.id, toId: toMem.id } }
      )
    }
  }
}

export async function getAllMemories(userId) {
  const graph = getGraph()
  const result = await graph.query(
    `MATCH (m:Memory {userId: $userId}) RETURN m ORDER BY m.updatedAt DESC`,
    { params: { userId } }
  )
  return formatMemoryResults(result)
}

export async function getMemoryById(userId, memoryId) {
  const graph = getGraph()
  const result = await graph.query(
    `MATCH (m:Memory {id: $id, userId: $userId}) RETURN m`,
    { params: { id: memoryId, userId } }
  )
  const memories = formatMemoryResults(result)
  return memories[0] || null
}

export async function getGraphData(userId) {
  const graph = getGraph()

  const nodeResult = await graph.query(
    `MATCH (m:Memory {userId: $userId}) RETURN m`,
    { params: { userId } }
  )

  const edgeResult = await graph.query(
    `MATCH (a:Memory {userId: $userId})-[r]->(b:Memory {userId: $userId}) RETURN a.id, type(r), b.id`,
    { params: { userId } }
  )

  const nodes = formatMemoryResults(nodeResult)
  const edges = (edgeResult.data || []).map((row, i) => ({
    id: `edge-${i}`,
    source: row['a.id'],
    target: row['b.id'],
    label: row['type(r)'],
  }))

  return { nodes, edges }
}

async function findExistingMemory(userId, name, type) {
  const graph = getGraph()
  const params = { userId, name }
  let query = `MATCH (m:Memory {userId: $userId, name: $name})`
  if (type) {
    query += ` WHERE m.type = $type`
    params.type = type
  }
  query += ` RETURN m LIMIT 1`

  const result = await graph.query(query, { params })
  const memories = formatMemoryResults(result)
  return memories[0] || null
}

function formatMemoryResults(result) {
  if (!result.data || result.data.length === 0) return []

  return result.data.map(row => {
    const node = row['m'] || row['connected']
    if (!node || !node.properties) return null
    return node.properties
  }).filter(Boolean)
}

function sanitizeRelType(type) {
  return (type || 'RELATED_TO').toUpperCase().replace(/[^A-Z_]/g, '_')
}
