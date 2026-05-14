import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getActiveSession, sendChatMessage } from '../../api/career'
import './CareerChat.css'

const EXAMPLE_PROMPTS = [
  'Why is this career recommended for me?',
  'What skills should I improve?',
  'Which universities suit my profile?',
  'What are the job prospects?',
]

/* ── Icons ──────────────────────────────────────────────────────────────── */
function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
function BotFaceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M12 3v4M8 7h8M9 15h.01M15 15h.01" />
    </svg>
  )
}

let msgId = 100

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function CareerChat() {
  const [sessionId, setSessionId] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState(null) // 'no_session' | 'generic'
  const [sessionErrorMsg, setSessionErrorMsg] = useState('')

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [sendError, setSendError] = useState(null)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  /* ── Load active session on mount ───────────────────────────────────────── */
  useEffect(() => {
    getActiveSession()
      .then(data => {
        // Backend returns { success, data: session }
        const session = data?.data
        const sid = session?._id || session?.sessionId || session?.id
        if (!sid) {
          setSessionError('no_session')
          setSessionLoading(false)
          return
        }
        setSessionId(sid)

        const history = Array.isArray(session?.chatHistory) ? session.chatHistory : []
        if (history.length > 0) {
          setMessages(history
            .slice(-10)
            .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
            .map(item => ({
              id: msgId++,
              role: item.role === 'user' ? 'user' : 'bot',
              text: item.content || '',
            }))
          )
        } else {
          // Prepopulate with greeting when there is no saved conversation yet
          setMessages([
            {
              id: msgId++,
              role: 'bot',
              text: "Hi! I'm your Profile Insight AI! I've reviewed your career profile and assessment results. Ask me anything about your recommended paths, skill gaps, or university options!",
            },
          ])
        }
        setSessionLoading(false)
      })
      .catch(err => {
        const msg = err.message || ''
        if (msg.includes('404') || msg.toLowerCase().includes('no active session') || msg.toLowerCase().includes('not found')) {
          setSessionError('no_session')
        } else {
          setSessionError('generic')
          setSessionErrorMsg(msg || 'Failed to connect to career chat service.')
        }
        setSessionLoading(false)
      })
  }, [])

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  /* ── Send message ─────────────────────────────────────────────────────── */
  async function sendMessage(text) {
    const trimmed = (text || input).trim()
    if (!trimmed || !sessionId) return

    const userMsg = { id: msgId++, role: 'user', text: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)
    setSendError(null)

    try {
      const data = await sendChatMessage(sessionId, trimmed)
      // Backend: { success, data: { response } }
      const reply = data?.data?.response || data?.response || 'No response received.'
      setMessages(prev => [...prev, { id: msgId++, role: 'bot', text: reply }])
    } catch (err) {
      const errMsg = err.message || 'Failed to get a response.'
      // Show error as a bot message bubble
      setMessages(prev => [
        ...prev,
        {
          id: msgId++,
          role: 'bot',
          text: `⚠️ ${errMsg.includes('ECONNREFUSED') || errMsg.includes('unavailable') || errMsg.includes('503')
            ? 'AI service is temporarily offline. Please check that Ollama is running.'
            : errMsg}`,
          isError: true,
        },
      ])
      setSendError(errMsg)
    } finally {
      setTyping(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  /* ── Loading ────────────────────────────────────────────────────────────── */
  if (sessionLoading) {
    return (
      <div className="career-chat-page">
        <div className="cc-header">
          <div className="cc-avatar"><BotFaceIcon /></div>
          <div className="cc-info">
            <div className="cc-bot-name">Profile Insight AI</div>
            <div className="cc-bot-status"><span className="cc-status-dot" style={{ background: '#f59e0b' }} /> Connecting…</div>
          </div>
        </div>
        <div className="cc-messages">
          <div className="cc-session-loading">Loading your session…</div>
        </div>
      </div>
    )
  }

  /* ── No active session ──────────────────────────────────────────────────── */
  if (sessionError === 'no_session') {
    return (
      <div className="career-chat-page">
        <div className="cc-header">
          <div className="cc-avatar"><BotFaceIcon /></div>
          <div className="cc-info">
            <div className="cc-bot-name">Profile Insight AI</div>
            <div className="cc-bot-status"><span className="cc-status-dot" style={{ background: '#ef4444' }} /> No session</div>
          </div>
        </div>
        <div className="cc-empty-state">
          <div className="cc-empty-icon">🤖</div>
          <div className="cc-empty-title">No Active Session Found</div>
          <div className="cc-empty-desc">
            You need to generate career recommendations first. The chat is powered by your recommendation session.
          </div>
          <Link to="/dashboard/career/recommendations" className="cc-cta-btn">
            Generate Recommendations →
          </Link>
        </div>
      </div>
    )
  }

  /* ── Generic session error ──────────────────────────────────────────────── */
  if (sessionError === 'generic') {
    return (
      <div className="career-chat-page">
        <div className="cc-header">
          <div className="cc-avatar"><BotFaceIcon /></div>
          <div className="cc-info">
            <div className="cc-bot-name">Profile Insight AI</div>
            <div className="cc-bot-status"><span className="cc-status-dot" style={{ background: '#ef4444' }} /> Error</div>
          </div>
        </div>
        <div className="cc-empty-state">
          <div className="cc-empty-icon">⚠️</div>
          <div className="cc-empty-title">Connection Error</div>
          <div className="cc-empty-desc">{sessionErrorMsg || 'Failed to connect to career chat service.'}</div>
          <button className="cc-cta-btn" onClick={() => window.location.reload()} type="button">Retry</button>
        </div>
      </div>
    )
  }

  /* ── Chat UI ────────────────────────────────────────────────────────────── */
  return (
    <div className="career-chat-page">
      {/* Header */}
      <div className="cc-header">
        <div className="cc-avatar"><BotFaceIcon /></div>
        <div className="cc-info">
          <div className="cc-bot-name">Profile Insight AI</div>
          <div className="cc-bot-status">
            <span className="cc-status-dot" /> Online — Context loaded
          </div>
        </div>
        <span className="cc-context-badge">Session Active</span>
      </div>

      {/* Messages */}
      <div className="cc-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`cc-msg ${msg.role}`}>
            <div className="cc-msg-avatar">
              {msg.role === 'bot' ? <BotFaceIcon /> : 'S'}
            </div>
            <div className={`cc-bubble${msg.isError ? ' cc-bubble-error' : ''}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="cc-msg bot">
            <div className="cc-msg-avatar"><BotFaceIcon /></div>
            <div className="cc-bubble">
              <div className="cc-typing">
                <span className="cc-typing-dot" />
                <span className="cc-typing-dot" />
                <span className="cc-typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="cc-prompts">
        {EXAMPLE_PROMPTS.map(p => (
          <button
            key={p}
            className="cc-prompt-chip"
            onClick={() => sendMessage(p)}
            disabled={typing}
            type="button"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="cc-input-row">
        <textarea
          ref={textareaRef}
          className="cc-textarea"
          placeholder="Ask about your career recommendations…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="cc-send-btn"
          onClick={() => sendMessage()}
          disabled={!input.trim() || typing}
          type="button"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}
