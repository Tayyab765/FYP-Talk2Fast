import { getApiBaseUrl } from '../config/api'
import {
  getAccessToken,
  getAccessTokenUserId,
  getGuestChatId,
  setGuestChatId,
} from '../utils/tokenStorage'

const AI_RECIPIENT_ID = 'ai'

async function parseJson(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null
  return response.json()
}

function errorFromJson(data, status) {
  if (!data) return `Request failed (${status})`
  if (typeof data.error === 'string') return data.error
  if (data.error) return JSON.stringify(data.error)
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map((e) => e.msg || e.message || String(e)).join(', ')
  }
  return `Request failed (${status})`
}

async function fetchOrExplain(url, options) {
  try {
    return await fetch(url, options)
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        'Cannot reach the API. Start the gateway (port 5000): cd FYP/backend && npm run dev. If you use VITE_API_BASE_URL, ensure it matches the gateway.'
      )
    }
    throw e
  }
}

export async function ensureGuestSession() {
  const baseUrl = getApiBaseUrl()
  const existing = getGuestChatId()
  const res = await fetchOrExplain(`${baseUrl}/api/auth/guest-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(existing ? { 'x-guest-id': existing } : {}),
    },
    body: JSON.stringify({}),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(errorFromJson(data, res.status))
  }
  if (data?.guestId) setGuestChatId(data.guestId)
  return data.guestId
}

function authHeadersForChat() {
  const token = getAccessToken()
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  const gid = getGuestChatId()
  if (!gid) {
    throw new Error('No guest session')
  }
  return { 'x-guest-id': gid }
}

async function getHistoryLookupId() {
  const token = getAccessToken()
  if (token) {
    const userId = getAccessTokenUserId()
    if (!userId) {
      throw new Error('Could not identify current user from token')
    }
    return userId
  }

  const existingGuestId = getGuestChatId()
  if (existingGuestId) return existingGuestId
  return ensureGuestSession()
}

export async function sendChatMessage(message) {
  const trimmed = (message || '').trim()
  if (!trimmed) {
    throw new Error('Message is empty')
  }

  const token = getAccessToken()
  if (!token) {
    await ensureGuestSession()
  }

  const baseUrl = getApiBaseUrl()
  const headers = {
    'Content-Type': 'application/json',
    ...authHeadersForChat(),
  }

  const res = await fetchOrExplain(`${baseUrl}/api/chatbot/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      recipient_id: AI_RECIPIENT_ID,
      message: trimmed,
    }),
  })

  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(errorFromJson(data, res.status))
  }

  return data
}

export async function loadChatHistory() {
  const baseUrl = getApiBaseUrl()
  const lookupId = await getHistoryLookupId()
  const headers = authHeadersForChat()

  const res = await fetchOrExplain(`${baseUrl}/api/chatbot/history/${encodeURIComponent(lookupId)}`, {
    method: 'GET',
    headers,
  })

  const data = await parseJson(res)
  if (res.status === 404) {
    return { conversationId: null, messages: [] }
  }
  if (!res.ok) {
    throw new Error(errorFromJson(data, res.status))
  }

  const conversation = data?.conversation || {}
  const messages = Array.isArray(conversation.messages) ? conversation.messages : []

  return {
    conversationId: conversation.id ? String(conversation.id) : null,
    messages,
  }
}

export async function deleteChatHistory(conversationId) {
  if (!conversationId) return
  const token = getAccessToken()
  if (!token && !getGuestChatId()) return

  const baseUrl = getApiBaseUrl()
  const headers = {
    ...authHeadersForChat(),
  }

  const res = await fetchOrExplain(`${baseUrl}/api/chatbot/history/${conversationId}`, {
    method: 'DELETE',
    headers,
  })

  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(errorFromJson(data, res.status))
  }
}
