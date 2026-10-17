import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Share2, PlusCircle, Network, Trash2 } from 'lucide-react'

export default function Sidebar({ sessions, activeSessionId, onNewChat, onDeleteChat, loading }) {
  const navigate = useNavigate()
  const [hoveredId, setHoveredId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (deletingId === id) return
    setDeletingId(id)
    try {
      await onDeleteChat(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Share2 size={18} color="var(--accent)" strokeWidth={2} />
          <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>
            GraphMind
          </span>
        </div>

        <button
          onClick={onNewChat}
          disabled={loading}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <PlusCircle size={14} />
          New Chat
        </button>
      </div>

      <div style={{ padding: '0 16px 8px' }}>
        <p style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
          Recent Chats
        </p>
      </div>

      <nav
        className="scrollbar-thin"
        style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}
      >
        {sessions.length === 0 && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px', margin: 0 }}>
            No chats yet
          </p>
        )}
        {sessions.map(session => {
          const isActive = session.id === activeSessionId
          const isHovered = hoveredId === session.id
          const isDeleting = deletingId === session.id

          return (
            <div
              key={session.id}
              onMouseEnter={() => setHoveredId(session.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
                background: isActive ? 'var(--accent-light)' : isHovered ? 'rgba(0,0,0,0.04)' : 'transparent',
                marginBottom: '2px',
                transition: 'background 0.15s',
              }}
            >
              <button
                onClick={() => navigate(`/?session=${session.id}`)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '8px 8px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '4px',
                }}
              >
                <span style={{
                  fontSize: '13px',
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                }}>
                  {session.title || 'New Chat'}
                </span>
                {!isHovered && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {formatDate(session.updatedAt)}
                  </span>
                )}
              </button>

              {/* Delete button — only visible on hover */}
              {isHovered && (
                <button
                  onClick={e => handleDelete(e, session.id)}
                  disabled={isDeleting}
                  title="Delete chat"
                  style={{
                    flexShrink: 0,
                    padding: '6px 7px',
                    marginRight: '4px',
                    border: 'none',
                    borderRadius: '4px',
                    background: 'transparent',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#EF4444',
                    opacity: isDeleting ? 0.5 : 1,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )
        })}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <Link
          to="/graph"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            padding: '6px 8px',
            borderRadius: '6px',
          }}
        >
          <Network size={14} />
          Memory Graph
        </Link>
      </div>
    </aside>
  )
}
