import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import './ChatAssistant.css'

const initialMessages = [
  {
    id: 1,
    from: 'assistant',
    time: '09:00 AM',
    text: [
      'Hello! I am your Talk2FAST assistant. I can help you with information regarding undergraduate and graduate admissions at FAST National University.',
      'What would you like to know today?',
    ],
    kind: 'intro',
  },
  {
    id: 2,
    from: 'user',
    time: '09:02 AM',
    text: ['What are the eligibility criteria for BS Computer Science?'],
    kind: 'plain',
  },
  {
    id: 3,
    from: 'assistant',
    time: '09:03 AM',
    kind: 'eligibility',
  },
]

export default function ChatAssistant() {
  const { userName } = useAuth()
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')

  const handleSend = (preset) => {
    const text = (preset || input).trim()
    if (!text) return
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: 'user', time, text: [text], kind: 'plain' },
      {
        id: prev.length + 2,
        from: 'assistant',
        time,
        text: [
          'This is a preview UI. Your AI answer will be shown here once the chatbot backend is connected.',
        ],
        kind: 'plain',
      },
    ])
    setInput('')
  }

  return (
    <div className="chat-shell">
      {/* Chat header (inside dashboard main area) */}
      <div className="chat-topbar">
        <div>
          <h2 className="chat-topbar-title">AI Admission Assistant</h2>
          <p className="chat-topbar-subtitle">
            Ask questions about FAST admissions, eligibility, and policies
          </p>
        </div>
        <button
          type="button"
          className="chat-clear-btn"
          onClick={() => setMessages(initialMessages)}
        >
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

      {/* Conversation area */}
      <div className="chat-main">
        {/* Date separator */}
        <div className="chat-date-row">
          <span>Today</span>
        </div>

        <div className="chat-thread">
          {messages.map((msg) => {
            if (msg.kind === 'eligibility') {
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
                      <h3 className="chat-eligibility-title">
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
                          <path d="M9 11l3 3L22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        BSCS Eligibility Criteria
                      </h3>
                      <ul className="chat-eligibility-list">
                        <li>
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
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                          <span>
                            At least <strong>60% marks</strong> in Matric/O-Levels or equivalent.
                          </span>
                        </li>
                        <li>
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
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                          <span>
                            At least <strong>50% marks</strong> in HSSC (Pre-Engineering/ICS) or
                            equivalent.
                          </span>
                        </li>
                        <li>
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
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                          <span>
                            Students with Pre-Medical background must take additional Mathematics
                            courses.
                          </span>
                        </li>
                      </ul>
                      <div className="chat-eligibility-note">
                        Note: Admission is granted on the basis of cumulative merit determined by
                        previous academic records and the Nu-Test/SAT results.
                      </div>
                    </div>
                    <span className="chat-meta">AI Assistant • {msg.time}</span>
                  </div>
                </div>
              )
            }

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

            // user message
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
        </div>
      </div>

      {/* Input + quick actions */}
      <div className="chat-bottom">
        <div className="chat-quick-row">
          <button type="button" onClick={() => handleSend('Eligibility criteria for BSCS')}>
            Eligibility
          </button>
          <button type="button" onClick={() => handleSend('Share the BSCS syllabus.')}>
            Syllabus
          </button>
          <button type="button" onClick={() => handleSend('Explain the fee structure for BS.')}>
            Fee Structure
          </button>
          <button
            type="button"
            onClick={() => handleSend('What are the important admission dates?')}
          >
            Important Dates
          </button>
        </div>

        <div className="chat-input-wrap">
          <input
            type="text"
            placeholder="Ask about FAST admissions, test centers, or deadlines..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button type="button" onClick={() => handleSend()}>
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