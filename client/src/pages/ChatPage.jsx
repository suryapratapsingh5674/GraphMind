import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import ChatWindow from '../components/ChatWindow.jsx'
import MemoryPanel from '../components/MemoryPanel.jsx'

const API = '/api'

export default function ChatPage() {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [evidence, setEvidence] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const sessionId = searchParams.get('session')

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
  }, [sessionId])

  async function loadSessions() {
    try {
      const res = await fetch(`${API}/sessions`)
      if (!res.ok) throw new Error('Failed to load sessions')
      const data = await res.json()
      setSessions(data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadSession(id) {
    try {
      const res = await fetch(`${API}/sessions/${id}`)
      if (!res.ok) throw new Error('Session not found')
      const data = await res.json()
      setActiveSession(data)
      setEvidence([])
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleNewChat() {
    try {
      const res = await fetch(`${API}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      })
      if (!res.ok) throw new Error('Failed to create chat')
      const session = await res.json()
      setSessions(prev => [session, ...prev])
      navigate(`/?session=${session.id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteChat(id) {
    try {
      const res = await fetch(`${API}/sessions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete chat')
      setSessions(prev => prev.filter(s => s.id !== id))
      if (sessionId === id) {
        setActiveSession(null)
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSend(content) {
    if (!activeSession) return
    setSending(true)
    setError(null)

    const userMsg = { id: Date.now(), role: 'user', content }
    setActiveSession(prev => ({
      ...prev,
      messages: [...(prev.messages || []), userMsg]
    }))

    try {
      const res = await fetch(`${API}/sessions/${activeSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send message')

      setActiveSession(prev => ({
        ...prev,
        messages: [...(prev.messages || []), data.message],
        title: prev.title === 'New Chat' ? content.slice(0, 50) : prev.title,
      }))

      setEvidence(data.evidence || [])

      if (activeSession.title === 'New Chat') {
        const shortTitle = content.slice(0, 50)
        await fetch(`${API}/sessions/${activeSession.id}/title`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: shortTitle }),
        })
        setSessions(prev => prev.map(s =>
          s.id === activeSession.id ? { ...s, title: shortTitle } : s
        ))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        loading={sending}
      />

      {/* overflow:hidden keeps the flex child from growing past the viewport */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {error && (
          <div style={{
            padding: '8px 20px',
            background: '#FEF2F2',
            borderBottom: '1px solid #FECACA',
            fontSize: '13px',
            color: '#B91C1C',
            display: 'flex',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            {error}
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontSize: '12px' }}>
              dismiss
            </button>
          </div>
        )}

        {!sessionId ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: 'var(--text-muted)',
          }}>
            <p style={{ fontSize: '15px', margin: 0 }}>Select a chat from the sidebar, or create a new one.</p>
            <button
              onClick={handleNewChat}
              style={{
                padding: '8px 16px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Start a new chat
            </button>
          </div>
        ) : (
          <ChatWindow
            session={activeSession}
            sending={sending}
            onSend={handleSend}
          />
        )}
      </main>

      <MemoryPanel evidence={evidence} />
    </div>
  )
}
