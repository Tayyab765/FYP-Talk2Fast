import { useState, useRef, useEffect } from 'react'
import './CareerChat.css'

const EXAMPLE_PROMPTS = [
  'Why is CS recommended for me?',
  'What skills should I improve?',
  'Which universities suit my profile?',
  'Is Data Science a good option?',
]

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'bot',
    text: "Hi! I'm your Profile Insight AI! I've reviewed your career profile and assessment results. Ask me anything about your recommended paths, skill gaps, or university options!",
  },
]

const BOT_REPLIES = {
  'Why is CS recommended for me?':
    "Based on your profile, CS is a top match (92%) because of your high mathematics score, strong logical reasoning results from the aptitude test, and your stated interest in Technology. Your problem-solving skill also aligns perfectly.",
  'What skills should I improve?':
    "To strengthen your profile for CS/Software Engineering, I'd recommend: (1) Learn a programming language like Python, (2) Practice Data Structures & Algorithms, (3) Build small projects to showcase on a portfolio.",
  'Which universities suit my profile?':
    "Given your Matric score of 87%, top picks include: FAST-NUCES (Entry test required), UET Lahore (aggregate-based), and GIKI (merit + test). I'd also suggest looking at ITU for strong industry links.",
  'Is Data Science a good option?':
    "Data Science is a great emerging field for you (84% match)! However, it's listed as Conditional because the degree programs often require strong programming background. I'd recommend building Python and statistics skills first.",
}

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

let msgId = 10

export default function CareerChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function getReply(userText) {
    const key = Object.keys(BOT_REPLIES).find((k) =>
      userText.toLowerCase().includes(k.toLowerCase().split(' ')[2])
    )
    return key
      ? BOT_REPLIES[key]
      : "That's a great question! Based on your profile and assessment, I'd suggest exploring more options in the Recommendations page. Would you like a deeper analysis of any specific degree?"
  }

  function sendMessage(text) {
    const trimmed = (text || input).trim()
    if (!trimmed) return
    const userMsg = { id: msgId++, role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const reply = getReply(trimmed)
      setMessages((prev) => [...prev, { id: msgId++, role: 'bot', text: reply }])
      setTyping(false)
    }, 1400)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

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
        <span className="cc-context-badge">Profile + Assessment</span>
      </div>

      {/* Messages */}
      <div className="cc-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`cc-msg ${msg.role}`}>
            <div className="cc-msg-avatar">
              {msg.role === 'bot' ? <BotFaceIcon /> : 'S'}
            </div>
            <div className="cc-bubble">{msg.text}</div>
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
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            className="cc-prompt-chip"
            onClick={() => sendMessage(p)}
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
          placeholder="Ask about your career recommendations..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
