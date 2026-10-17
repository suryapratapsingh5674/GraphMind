import { Database, Tag, ArrowRight } from 'lucide-react'

const TYPE_COLORS = {
  PROJECT: { bg: '#DBEAFE', text: '#1D4ED8' },
  TECHNOLOGY: { bg: '#D1FAE5', text: '#065F46' },
  CONCEPT: { bg: '#EDE9FE', text: '#5B21B6' },
  DECISION: { bg: '#FEF3C7', text: '#92400E' },
  PERSON: { bg: '#FCE7F3', text: '#9D174D' },
  FACT: { bg: '#F3F4F6', text: '#374151' },
}

export default function MemoryPanel({ evidence }) {
  if (!evidence || evidence.length === 0) {
    return (
      <aside style={panelStyle}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={14} color="var(--text-secondary)" />
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Memory Evidence</span>
        </div>
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
            Memories used to answer will appear here.
          </p>
        </div>
      </aside>
    )
  }

  const relationships = buildRelationshipPaths(evidence)

  return (
    <aside style={panelStyle}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Database size={14} color="var(--text-secondary)" />
        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Memory Evidence</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '11px',
          background: 'var(--accent-light)',
          color: 'var(--accent)',
          padding: '1px 6px',
          borderRadius: '10px',
        }}>
          {evidence.length}
        </span>
      </div>

      <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {evidence.map((mem, i) => (
            <MemoryCard key={mem.id || i} memory={mem} isHighlighted={i === 0} />
          ))}
        </div>

        {relationships.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: '0.5px' }}>
              Connections
            </p>
            {relationships.map((path, i) => (
              <RelationshipPath key={i} path={path} />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function MemoryCard({ memory, isHighlighted }) {
  const colors = TYPE_COLORS[memory.type] || TYPE_COLORS.FACT

  return (
    <div style={{
      padding: '10px',
      border: '1px solid var(--border)',
      borderLeft: isHighlighted ? '3px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: '6px',
      background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{
          fontSize: '10px',
          fontWeight: '600',
          background: colors.bg,
          color: colors.text,
          padding: '1px 6px',
          borderRadius: '4px',
          letterSpacing: '0.3px',
        }}>
          {memory.type || 'FACT'}
        </span>
        {memory.name && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
            {memory.name}
          </span>
        )}
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5' }}>
        {memory.content}
      </p>
      {memory.relationshipType && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0', fontStyle: 'italic' }}>
          via {memory.relationshipType} relationship
        </p>
      )}
    </div>
  )
}

function RelationshipPath({ path }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 8px',
      background: 'var(--surface-alt)',
      borderRadius: '4px',
      marginBottom: '4px',
      flexWrap: 'wrap',
    }}>
      {path.map((part, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {i > 0 && i % 2 === 0 && <ArrowRight size={10} color="var(--text-muted)" />}
          <span style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            color: i % 2 === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontStyle: i % 2 === 1 ? 'italic' : 'normal',
          }}>
            {part}
          </span>
        </span>
      ))}
    </div>
  )
}

function buildRelationshipPaths(evidence) {
  const paths = []
  for (const mem of evidence) {
    if (mem.relationshipType && mem.name) {
      paths.push([mem.name, `→ ${mem.relationshipType} →`, '...'])
    }
  }
  return paths.slice(0, 4)
}

const panelStyle = {
  width: '280px',
  minWidth: '280px',
  background: 'var(--surface-alt)',
  borderLeft: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
}
