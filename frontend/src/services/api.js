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
export async function downloadEnvironmentalReport(payload) {
  const response = await fetch(`${BASE_URL}/api/reports/environmental`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = `Report generation failed (${response.status})`
    try {
      const data = await response.json()
      if (typeof data.detail === 'string') message = data.detail
    } catch {
      // Keep the HTTP error.
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  if (!blob.type.includes('pdf')) {
    throw new Error('Backend did not return a PDF.')
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'kizuki-environmental-report.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}