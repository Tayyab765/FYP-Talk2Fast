import { getApiBaseUrl } from '../config/api'
import { httpJson } from './http'

async function parseJsonOrNull(response) {
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  if (!isJson) return null
  return await response.json()
}

export async function signupApi({ full_name, email, password }) {
  const baseUrl = getApiBaseUrl()
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, password }),
  })

  const data = await parseJsonOrNull(res)

  if (!res.ok) {
    const msg = (data && (data.error || data.message || data.msg)) || 'Signup failed'
    throw new Error(msg)
  }

  return data
}

export async function loginApi({ email, password }) {
  const baseUrl = getApiBaseUrl()
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await parseJsonOrNull(res)

  if (!res.ok) {
    const msg = (data && (data.error || data.message || data.msg)) || 'Login failed'
    throw new Error(msg)
  }

  return data
}

export async function getProfile() {
  return httpJson('/api/auth/profile', { method: 'GET' })
}

