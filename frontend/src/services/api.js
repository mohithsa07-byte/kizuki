const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://127.0.0.1:8000'
    : 'https://kizuki-eta.vercel.app')
).replace(/\/+$/, '')

export async function apiGet(path) {
  let response

  try {
    response = await fetch(`${BASE_URL}${path}`)
  } catch {
    throw new Error('Cannot reach the backend. Please check the API connection.')
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`

    try {
      const body = await response.json()
      if (typeof body.detail === 'string') {
        detail = body.detail
      }
    } catch {
      // Keep default error
    }

    throw new Error(detail)
  }

  return response.json()
}