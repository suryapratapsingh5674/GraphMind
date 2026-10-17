import { useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'

const TYPE_COLORS = {
  PROJECT: '#3B82F6',
  TECHNOLOGY: '#10B981',
  CONCEPT: '#8B5CF6',
  DECISION: '#F59E0B',
  PERSON: '#EC4899',
  FACT: '#6B7280',
}

export default function ChatWindow({ session, sending, onSend }) {
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages, sending])

  function handleSubmit(e) {
    e.preventDefault()
    const value = inputRef.current?.value?.trim()
    if (!value || sending) return
    onSend(value)
    inputRef.current.value = ''
  }

  if (!session) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        color: 'var(--text-muted)',
      }}>
        <Share2Icon />
        <p style={{ fontSize: '15px', margin: 0 }}>Select a chat or start a new one</p>
      </div>
    )
  }

  const messages = session.messages || []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
          {session.title || 'New Chat'}
        </span>
        {messages.length > 0 && (
          <span style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            background: 'var(--surface-alt)',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}>
            {messages.filter(m => m.role === 'assistant').length} responses
          </span>
        )}
      </div>

      <div
        className="scrollbar-thin"
        style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <p style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px' }}>
              What's on your mind?
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              Tell me about your projects. I'll remember everything across sessions.
            </p>
          </div>
        )}

        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {sending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            Retrieving memories...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask me anything..."
            disabled={sending}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '14px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              outline: 'none',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          <button
            type="submit"
            disabled={sending}
            style={{
              padding: '10px 14px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: '10px',
      alignItems: 'flex-start',
    }}>
      {!isUser && (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'var(--accent-light)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: '600',
          flexShrink: 0,
          marginTop: '2px',
        }}>
          GM
        </div>
      )}
      <div
        style={{
          maxWidth: '72%',
          padding: '10px 14px',
          borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
          background: isUser ? 'var(--accent-light)' : 'var(--surface)',
          border: isUser ? 'none' : '1px solid var(--border)',
          fontSize: '14px',
          lineHeight: '1.6',
          color: isUser ? 'var(--accent-hover)' : 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}

function Share2Icon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}
