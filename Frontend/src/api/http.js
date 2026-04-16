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

  // Network error handling (from career module)
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error('Network error: Unable to connect to backend services.');
  }

  // Debug logging (from mock test module)
  console.log('=== HTTP REQUEST ===')
  console.log('URL:', url)
  console.log('Method:', options.method || 'GET')
  console.log('Headers:', headers)
  console.log('Body (raw):', options.body)
  console.log('Body type:', typeof options.body)
  console.log('===================')

  let data = null
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  if (isJson) data = await response.json()

  console.log('=== HTTP RESPONSE ===')
  console.log('Status:', response.status)
  console.log('OK:', response.ok)
  console.log('Data:', data)
  console.log('====================')

  if (!response.ok) {
    let message = (data && (data.error || data.message || data.msg)) || `Request failed with status ${response.status}`
    if (data && data.errors && Array.isArray(data.errors)) {
      message += ': ' + data.errors.map(e => `${e.field || ''} ${e.message || ''}`.trim()).join(', ')
    }
    throw new Error(message)
  }

  return data
}

