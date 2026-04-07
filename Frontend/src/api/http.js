import { getApiBaseUrl } from '../config/api'
import { getAccessToken } from '../utils/tokenStorage'

export async function httpJson(path, options = {}) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path}`

  const token = getAccessToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error('Network error: Unable to connect to backend services.');
  }

  let data = null
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  if (isJson) data = await response.json()

  if (!response.ok) {
    const message =
      (data && (data.error || data.message || data.msg)) ||
      `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return data
}

