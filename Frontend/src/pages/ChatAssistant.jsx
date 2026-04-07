import { useCallback, useEffect, useState } from 'react'
import { deleteChatHistory, loadChatHistory, sendChatMessage } from '../api/chat.js'
import './ChatAssistant.css'

function buildIntroMessages() {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return [
    {
      id: 'intro',
      from: 'assistant',
      time,
      text: [
        'Hello! I am your Talk2FAST assistant. I can help you with undergraduate and graduate admissions at FAST.',
        'What would you like to know?',
      ],
      kind: 'plain',
    },
  ]
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState(buildIntroMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrapHistory() {
      try {
        const history = await loadChatHistory()
        if (cancelled) return

        if (history.conversationId) {
          setConversationId(history.conversationId)
        }

        if (Array.isArray(history.messages) && history.messages.length > 0) {
          setMessages(mapHistoryToUi(history.messages))
        } else {
          setMessages(buildIntroMessages())
        }
      } catch {
        if (cancelled) return
        // Keep intro if history can't load (e.g., first time use)
        setMessages(buildIntroMessages())
      }
    }

    bootstrapHistory()
    return () => {
      cancelled = true
    }
  }, [])

  const handleClear = useCallback(async () => {
    setError('')
    try {
      if (conversationId) {
        await deleteChatHistory(conversationId)
      }
    } catch (e) {
      setError(e.message || 'Could not clear chat on server')
    }
    setConversationId(null)
    setMessages(buildIntroMessages())
  }, [conversationId])

  const handleSend = async (preset) => {
    const text = (preset || input).trim()
    if (!text || sending) return

    setError('')
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsgId = `u-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, from: 'user', time, text: [text], kind: 'plain' },
    ])

    setInput('')
    setSending(true)

    try {
      const data = await sendChatMessage(text)
      if (data?.conversationId != null) {
        setConversationId(String(data.conversationId))
      }
      const aiText = data?.aiMessage?.text ?? ''
      if (!aiText) {
        throw new Error('No reply from assistant')
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          from: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: [aiText],
          kind: 'plain',
        },
      ])
    } catch (e) {
      setError(e.message || 'Something went wrong')
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          from: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: [
            'Sorry, I could not reach the assistant. Check that the backend and RAG service are running, and that VITE_API_BASE_URL points to your gateway (default http://localhost:5000).',
          ],
          kind: 'plain',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat-shell">
      <div className="chat-topbar">
        <div>
          <h2 className="chat-topbar-title">AI Admission Assistant</h2>
          <p className="chat-topbar-subtitle">
            Ask questions about FAST admissions, eligibility, and policies
          </p>
        </div>
        <button type="button" className="chat-clear-btn" onClick={handleClear} disabled={sending}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Clear Chat
        </button>
      </div>

      <div className="chat-main">
        <div className="chat-date-row">
          <span>Today</span>
        </div>

        {error ? <div className="chat-error-banner">{error}</div> : null}

        <div className="chat-thread">
          {messages.map((msg) => {
            if (msg.from === 'assistant') {
              return (
                <div key={msg.id} className="chat-row chat-row-assistant">
                  <div className="chat-avatar chat-avatar-assistant">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="7" width="18" height="10" rx="2" />
                      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                      <path d="M8 4h8" />
                      <path d="M12 2v2" />
                    </svg>
                  </div>
                  <div className="chat-bubble-group">
                    <div className="chat-bubble chat-bubble-assistant">
                      {msg.text.map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                    <span className="chat-meta">AI Assistant • {msg.time}</span>
                  </div>
                </div>
              )
            }

            return (
              <div key={msg.id} className="chat-row chat-row-user">
                <div className="chat-avatar chat-avatar-user">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 20c0-3.3137 2.6863-6 6-6s6 2.6863 6 6" />
                  </svg>
                </div>
                <div className="chat-bubble-group chat-bubble-group-user">
                  <div className="chat-bubble chat-bubble-user">
                    {msg.text.map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                  <span className="chat-meta">You • {msg.time}</span>
                </div>
              </div>
            )
          })}
          {sending ? (
            <div className="chat-row chat-row-assistant">
              <div className="chat-avatar chat-avatar-assistant">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="7" width="18" height="10" rx="2" />
                  <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                  <path d="M8 4h8" />
                  <path d="M12 2v2" />
                </svg>
              </div>
              <div className="chat-bubble-group">
                <div className="chat-bubble chat-bubble-assistant chat-bubble-thinking">
                  <div className="typing-indicator" aria-label="Assistant is thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <span className="chat-meta">AI Assistant is thinking...</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="chat-bottom">
        <div className="chat-quick-row">
          <button type="button" onClick={() => handleSend('Eligibility criteria for BSCS')} disabled={sending}>
            Eligibility
          </button>
          <button type="button" onClick={() => handleSend('What programs are offered at Islamabad campus?')} disabled={sending}>
            Programs
          </button>
          <button type="button" onClick={() => handleSend('Explain the fee structure for BS.')} disabled={sending}>
            Fee Structure
          </button>
          <button
            type="button"
            onClick={() => handleSend('What are the important admission dates?')}
            disabled={sending}
          >
            Important Dates
          </button>
        </div>

        <div className="chat-input-wrap">
          <input
            type="text"
            placeholder="Ask about FAST admissions, test centers, or deadlines..."
            value={input}
            disabled={sending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button type="button" onClick={() => handleSend()} disabled={sending}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 4 19 12 5 20 7 12 5 4" />
            </svg>
          </button>
        </div>

        <p className="chat-disclaimer">
          Disclaimer: This AI assistant provides general information for guidance. Please refer to
          the official NUCES prospectus for legally binding policies.
        </p>
      </div>
    </div>
  )
}

function mapHistoryToUi(historyMessages) {
  return historyMessages.map((m, idx) => ({
    id: `h-${idx}-${new Date(m.createdAt || Date.now()).getTime()}`,
    from: m.type === 'ai' ? 'assistant' : 'user',
    time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    text: [String(m.text || '')],
    kind: 'plain',
  }))
}
