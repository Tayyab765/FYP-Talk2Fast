const ACCESS_TOKEN_KEY = 'accessToken'
const USER_NAME_KEY = 'userName'
const GUEST_CHAT_ID_KEY = 'chatGuestId'

export function saveAccessToken(token, persistent) {
  if (!token) return

  try {
    if (persistent) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
      sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    } else {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    }
  } catch {
    // ignore storage errors
  }
}

export function getAccessToken() {
  try {
    return (
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
      sessionStorage.getItem(ACCESS_TOKEN_KEY)
    )
  } catch {
    return null
  }
}

export function getAccessTokenUserId() {
  const token = getAccessToken()
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    return payload?.sub || payload?.user_id || payload?.id || null
  } catch {
    return null
  }
}

export function clearAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(USER_NAME_KEY)
    sessionStorage.removeItem(USER_NAME_KEY)
    localStorage.removeItem(GUEST_CHAT_ID_KEY)
  } catch {
    // ignore storage errors
  }
}

export function saveUserName(name, persistent) {
  if (!name) return

  try {
    if (persistent) {
      localStorage.setItem(USER_NAME_KEY, name)
      sessionStorage.removeItem(USER_NAME_KEY)
    } else {
      sessionStorage.setItem(USER_NAME_KEY, name)
      localStorage.removeItem(USER_NAME_KEY)
    }
  } catch {
    // ignore storage errors
  }
}

export function getUserName() {
  try {
    return (
      localStorage.getItem(USER_NAME_KEY) ||
      sessionStorage.getItem(USER_NAME_KEY)
    )
  } catch {
    return ''
  }
}

export function getGuestChatId() {
  try {
    return localStorage.getItem(GUEST_CHAT_ID_KEY)
  } catch {
    return null
  }
}

export function setGuestChatId(id) {
  if (!id) return
  try {
    localStorage.setItem(GUEST_CHAT_ID_KEY, id)
  } catch {
    // ignore
  }
}

export function clearGuestChatId() {
  try {
    localStorage.removeItem(GUEST_CHAT_ID_KEY)
  } catch {
    // ignore
  }
}
