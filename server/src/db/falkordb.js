import { createClient, Graph } from 'falkordb'

let client = null
let graph = null

export async function connectToFalkorDB() {
  client = createClient({
    socket: {
      host: process.env.FALKORDB_HOST || 'localhost',
      port: parseInt(process.env.FALKORDB_PORT || '6379'),
    }
  })

  await client.connect()

  graph = new Graph(client, 'graphmind')

  console.log('Connected to FalkorDB')
  return graph
}

export function getGraph() {
  if (!graph) throw new Error('FalkorDB not connected yet')
  return graph
}

export async function closeFalkorDB() {
  if (client) await client.disconnect()
}
