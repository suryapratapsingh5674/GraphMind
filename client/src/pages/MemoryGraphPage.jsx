import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Share2, ArrowLeft, X } from 'lucide-react'

const TYPE_COLORS = {
  PROJECT: '#3B82F6',
  TECHNOLOGY: '#10B981',
  CONCEPT: '#8B5CF6',
  DECISION: '#F59E0B',
  PERSON: '#EC4899',
  FACT: '#94A3B8',
}

export default function MemoryGraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchGraphData()
  }, [])

  async function fetchGraphData() {
    try {
      setLoading(true)
      const res = await fetch('/api/memories/graph')
      if (!res.ok) throw new Error('Failed to load graph')
      const data = await res.json()

      const flowNodes = layoutNodes(data.nodes)
      const flowEdges = data.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: false,
        style: { stroke: '#CBD5E1', strokeWidth: 1.5 },
        labelStyle: { fontSize: 10, fill: '#6B7280' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#CBD5E1' },
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function layoutNodes(memories) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(memories.length)))
    return memories.map((mem, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const color = TYPE_COLORS[mem.type] || TYPE_COLORS.FACT

      return {
        id: mem.id,
        position: { x: col * 220 + 60, y: row * 160 + 60 },
        data: {
          label: mem.name || mem.content?.slice(0, 30),
          memory: mem,
          color,
        },
        style: {
          background: '#fff',
          border: `2px solid ${color}`,
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          color: '#111827',
          maxWidth: '180px',
          cursor: 'pointer',
        },
        type: 'default',
      }
    })
  }

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node.data.memory)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>
        Loading graph...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: '#B91C1C', fontSize: '14px' }}>{error}</p>
        <Link to="/" style={{ color: 'var(--accent)', fontSize: '13px' }}>← Back to chat</Link>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
        background: 'var(--surface)',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>
          <ArrowLeft size={14} />
          Back to chat
        </Link>
        <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Share2 size={16} color="var(--accent)" />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Memory Graph</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
          {nodes.length} memories · {edges.length} relationships
        </span>
        <button
          onClick={fetchGraphData}
          style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'transparent', color: 'var(--text-secondary)' }}
        >
          Refresh
        </button>
      </header>

      <div style={{ flex: 1, position: 'relative' }}>
        {nodes.length === 0 ? (
          <EmptyState />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background color="#E5E7EB" gap={24} />
            <Controls />
          </ReactFlow>
        )}

        {selectedNode && (
          <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>

      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '16px',
        flexShrink: 0,
        background: 'var(--surface)',
      }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NodeDetail({ node, onClose }) {
  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '280px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '16px',
      zIndex: 10,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Memory Details</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <DetailRow label="Type" value={node.type} />
        <DetailRow label="Name" value={node.name} />
        <DetailRow label="Content" value={node.content} />
        <DetailRow label="Session" value={node.sourceSessionId?.slice(0, 8) + '...'} />
        <DetailRow label="Created" value={new Date(node.createdAt).toLocaleDateString()} />
        {node.updatedAt !== node.createdAt && (
          <DetailRow label="Updated" value={new Date(node.updatedAt).toLocaleDateString()} />
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p style={{ margin: '0 0 2px', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '12px',
      color: 'var(--text-muted)',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      <p style={{ fontSize: '15px', margin: 0, color: 'var(--text-secondary)' }}>No memories yet</p>
      <p style={{ fontSize: '13px', margin: 0, textAlign: 'center', maxWidth: '260px', lineHeight: '1.6' }}>
        Start a chat and tell the assistant about your projects. Memories will appear here as a graph.
      </p>
      <Link to="/" style={{ color: 'var(--accent)', fontSize: '13px', textDecoration: 'none' }}>
        Go to chat →
      </Link>
    </div>
  )
}
