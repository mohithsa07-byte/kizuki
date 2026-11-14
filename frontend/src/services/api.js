const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function apiGet(path) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`)
  } catch {
    throw new Error('Cannot reach the backend. Is it running?')
  }
  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      // keep the default message
    }
    throw new Error(detail)
  }
  return response.json()
}
