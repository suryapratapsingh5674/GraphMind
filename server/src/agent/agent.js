import { ChatAnthropic } from '@langchain/anthropic'
import { tool } from '@langchain/core/tools'
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from '@langchain/core/messages'
import { z } from 'zod'
import {
  retrieveMemories,
  retrieveConnectedMemories,
  saveMemories,
  saveRelationships,
  getAllMemories,
} from '../services/memory.js'

const BASE_SYSTEM_PROMPT = `You are GraphMind, an AI assistant with persistent graph-based memory.

You have access to tools that let you search and save memories in a knowledge graph database.
The graph stores facts as nodes connected by typed relationships like USES, DEPENDS_ON, WORKS_ON, DECIDED, RELATED_TO.

Your workflow for each message:
1. The USER CONTEXT section above already contains what you know about this user — use it.
2. Use search_memories if you need to find something specific not already in your context.
3. Use explore_connections to discover related facts from retrieved memory IDs.
4. Answer the user's question. Reference specific memories you know ("Based on what I remember, you're studying at Manipal...").
5. Use save_memories to store any NEW facts learned in this conversation.
6. Use save_relationships to capture how new facts relate to existing ones.

Rules:
- ALWAYS use the pre-loaded USER CONTEXT before searching. It contains what you already know.
- If a fact is already in USER CONTEXT, do NOT save it again.
- If you don't have memory about something, say so honestly. Don't invent facts.
- Keep answers helpful, warm, and grounded in actual memories.
- Save memories only for meaningful, reusable facts (not greetings or filler).`

function buildSystemPrompt(memories) {
  if (!memories || memories.length === 0) {
    return BASE_SYSTEM_PROMPT + '\n\n---\nUSER CONTEXT: No memories saved yet. This is a fresh start for this user.'
  }

  const memLines = memories
    .slice(0, 30) // cap at 30 to keep prompt size sane
    .map(m => `- [${m.type}] ${m.name}: ${m.content}`)
    .join('\n')

  return BASE_SYSTEM_PROMPT + `\n\n---\nUSER CONTEXT (your memory graph for this user — treat this as ground truth):\n${memLines}`
}

export async function runAgent(userId, sessionId, userMessage, conversationHistory) {
  const model = new ChatAnthropic({
    model: 'claude-haiku-4-5',
    temperature: 0,
    maxTokens: 2048,
  })

  // Pre-load all memories so the agent starts with full cross-session context.
  // This is the key step that makes memory persist across chat sessions.
  const existingMemories = await getAllMemories(userId)
  const systemPrompt = buildSystemPrompt(existingMemories)

  const searchMemoriesTool = tool(
    async ({ query }) => {
      const memories = await retrieveMemories(userId, query)
      if (memories.length === 0) return 'No memories found for this query.'
      return JSON.stringify(memories)
    },
    {
      name: 'search_memories',
      description: 'Search the graph database for memories relevant to a specific query. Use when you need details not in USER CONTEXT.',
      schema: z.object({
        query: z.string().describe('The search query to find relevant memories'),
      }),
    }
  )

  const exploreConnectionsTool = tool(
    async ({ memoryIds }) => {
      const connected = await retrieveConnectedMemories(userId, memoryIds)
      if (connected.length === 0) return 'No connected memories found.'
      return JSON.stringify(connected)
    },
    {
      name: 'explore_connections',
      description: 'Follow graph relationships to find memories connected to given memory IDs.',
      schema: z.object({
        memoryIds: z.array(z.string()).describe('List of memory IDs to explore connections from'),
      }),
    }
  )

  const saveMemoriesTool = tool(
    async ({ memories }) => {
      const saved = await saveMemories(userId, sessionId, memories)
      return `Saved ${saved.length} memories: ${saved.map(m => `${m.name} (${m.action})`).join(', ')}`
    },
    {
      name: 'save_memories',
      description: 'Save new facts as memory nodes in the graph. Only call for facts NOT already in USER CONTEXT.',
      schema: z.object({
        memories: z.array(z.object({
          type: z.enum(['PROJECT', 'TECHNOLOGY', 'CONCEPT', 'DECISION', 'PERSON', 'FACT']),
          name: z.string().describe('Short unique name for this memory node'),
          content: z.string().describe('The actual fact or information to remember'),
        })),
      }),
    }
  )

  const saveRelationshipsTool = tool(
    async ({ relationships }) => {
      await saveRelationships(userId, relationships)
      return `Saved ${relationships.length} relationships`
    },
    {
      name: 'save_relationships',
      description: 'Create typed edges between memory nodes in the graph.',
      schema: z.object({
        relationships: z.array(z.object({
          fromName: z.string().describe('Name of the source memory node'),
          toName: z.string().describe('Name of the target memory node'),
          type: z.enum(['USES', 'DEPENDS_ON', 'WORKS_ON', 'DECIDED', 'RELATED_TO', 'SUPPORTS', 'BUILT_WITH']),
        })),
      }),
    }
  )

  const tools = [searchMemoriesTool, exploreConnectionsTool, saveMemoriesTool, saveRelationshipsTool]
  const modelWithTools = model.bindTools(tools)

  const toolMap = {
    search_memories: searchMemoriesTool,
    explore_connections: exploreConnectionsTool,
    save_memories: saveMemoriesTool,
    save_relationships: saveRelationshipsTool,
  }

  const messages = [
    new SystemMessage(systemPrompt),
    ...conversationHistory.slice(-6).map(msg =>
      msg.role === 'user'
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    ),
    new HumanMessage(userMessage),
  ]

  const usedMemories = [...existingMemories] // seed evidence with pre-loaded memories
  let finalAnswer = ''

  let response = await modelWithTools.invoke(messages)
  messages.push(response)

  let iterations = 0
  while (response.tool_calls && response.tool_calls.length > 0 && iterations < 8) {
    iterations++

    for (const toolCall of response.tool_calls) {
      const toolFn = toolMap[toolCall.name]
      if (!toolFn) continue

      const result = await toolFn.invoke(toolCall.args)

      if (toolCall.name === 'search_memories' || toolCall.name === 'explore_connections') {
        try {
          const parsed = JSON.parse(result)
          if (Array.isArray(parsed)) usedMemories.push(...parsed)
        } catch {}
      }

      messages.push(new ToolMessage({ content: result, tool_call_id: toolCall.id }))
    }

    response = await modelWithTools.invoke(messages)
    messages.push(response)
  }

  if (typeof response.content === 'string') {
    finalAnswer = response.content
  } else if (Array.isArray(response.content)) {
    finalAnswer = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')
  }

  const uniqueMemories = deduplicateMemories(usedMemories)

  return {
    answer: finalAnswer,
    evidence: uniqueMemories,
  }
}

function deduplicateMemories(memories) {
  const seen = new Set()
  return memories.filter(m => {
    if (!m || !m.id) return false
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}
