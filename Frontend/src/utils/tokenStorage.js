const ACCESS_TOKEN_KEY = 'accessToken'
const USER_NAME_KEY = 'userName'

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

export function clearAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(USER_NAME_KEY)
    sessionStorage.removeItem(USER_NAME_KEY)
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


