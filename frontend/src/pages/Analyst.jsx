import { useEffect, useRef, useState } from 'react'
import {
  BrainCircuit, Send, Sparkles, Globe2,
  Database, ShieldCheck, LoaderCircle,
  MapPin, RotateCcw, AlertCircle
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import {
  MapContainer, TileLayer, CircleMarker,
  useMapEvents
} from 'react-leaflet'

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const START_LOCATION = {
  name: 'Bengaluru',
  lat: 12.9716,
  lng: 77.5946
}

const SUGGESTIONS = [
  'How has the temperature changed since 1995?',
  'Which years had the highest rainfall?',
  'Compare rainfall variability across the historical record.',
  'What can these records tell us about climate change?'
]

const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#102734] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50'

function MapPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    }
  })

  return null
}

function WorldMap({ location, onPick }) {
  return (
    <div className="h-[250px] overflow-hidden rounded-xl border border-white/10">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={3}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <MapPicker onPick={onPick} />
        <CircleMarker
          center={[location.lat, location.lng]}
          radius={9}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: '#10b981',
            fillOpacity: 1
          }}
        />
      </MapContainer>
    </div>
  )
}

function Message({ message }) {
  const user = message.role === 'user'

  return (
    <div className={`flex ${user ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[85%] ${
        user
          ? 'bg-emerald-400/15 text-emerald-50'
          : 'border border-white/[0.07] bg-white/[0.045] text-slate-200'
      }`}>
        {!user && (
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            <BrainCircuit size={14} />
            KIZUKI Analyst
          </div>
        )}
        <div className="prose prose-invert prose-sm max-w-none break-words">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export default function Analyst() {
  const [location, setLocation] = useState(START_LOCATION)
  const [latInput, setLatInput] = useState('12.9716')
  const [lngInput, setLngInput] = useState('77.5946')
  // GLOBAL_ANALYST_SEARCH_V1
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [mapVersion, setMapVersion] = useState(0)

  async function searchWorld() {
    const query = search.trim()

    if (query.length < 2) return

    setSearching(true)
    setSearchError('')
    setSearchResults([])

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`
      )

      if (!response.ok) {
        throw new Error('Location search unavailable.')
      }

      const data = await response.json()
      const results = data.results || []

      setSearchResults(results)

      if (!results.length) {
        setSearchError('No matching locations found.')
      }
    } catch (error) {
      setSearchError(error.message || 'Search failed.')
    } finally {
      setSearching(false)
    }
  }

  function chooseSearchResult(place) {
    selectLocation({
      name: [
        place.name,
        place.admin1,
        place.country
      ].filter(Boolean).join(', '),
      lat: Number(place.latitude),
      lng: Number(place.longitude)
    })

    setSearchResults([])
    setSearch('')
    setMapVersion(v => v + 1)
  }

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'Welcome to KIZUKI Global AI Analyst. Just ask about any country or city. I will identify the location automatically, retrieve NASA POWER records, and analyze them with NVIDIA Nemotron. The map is optional.'
  }])

  const bottomRef = useRef(null)
  const pendingRef = useRef(false)
  const sessionRef = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    })
  }, [messages, loading])

  function resetChat() {
    sessionRef.current += 1
    setMessages([{
      role: 'assistant',
      text: 'Location updated. Ask me about its historical climate records.'
    }])
    setMetadata(null)
    setError('')
    setLoading(false)
    pendingRef.current = false
  }

  function selectLocation(next) {
    setLocation(next)
    setLatInput(String(next.lat))
    setLngInput(String(next.lng))
    resetChat()
  }

  function pickLocation(lat, lng) {
    selectLocation({
      name: 'Custom coordinates',
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4))
    })
  }

  function applyCoordinates() {
    const lat = Number(latInput)
    const lng = Number(lngInput)

    if (
      !latInput.trim() || !lngInput.trim() ||
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180
    ) {
      setError('Enter latitude between -90 and 90 and longitude between -180 and 180.')
      return
    }

    pickLocation(lat, lng)
  }

  async function send(value = input) {
    const question = value.trim()
    if (!question || pendingRef.current) return

    pendingRef.current = true
    setLoading(true)
    setError('')
    setInput('')

    const session = sessionRef.current
    const history = messages
      .filter(m => m.role === 'user' || m.fromModel)
      .slice(-8)
      .map(m => ({
        role: m.role,
        content: m.text
      }))

    setMessages(prev => [
      ...prev,
      { role: 'user', text: question }
    ])

    try {
      const response = await fetch(`${API_BASE}/api/analyst/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: question,
          lat: location.lat,
          lng: location.lng,
          location_name: location.name,
          history
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : `Request failed (${response.status})`
        )
      }

      if (session !== sessionRef.current) return

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          fromModel: true
        }
      ])

      setMetadata(data)
    } catch (err) {
      if (session !== sessionRef.current) return

      setError(err.message || 'Unable to reach AI Analyst.')
    } finally {
      if (session === sessionRef.current) {
        pendingRef.current = false
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#07111c] px-4 py-6 text-white sm:px-7">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-[#10343b] via-[#0a222f] to-[#081521] p-7 sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-400/10 blur-[80px]" />

        <div className="relative">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <Sparkles size={17} />
            KIZUKI / NVIDIA AI INTELLIGENCE
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            AI Climate Analyst
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            Ask questions about any place on Earth. KIZUKI automatically detects locations and retrieves climate evidence
            anywhere on Earth, powered by NVIDIA Nemotron
            and historical NASA POWER records.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200">
              NVIDIA Nemotron
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
              NASA POWER 1995–2025
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
              Worldwide coordinates
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d1d2b] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Globe2 size={18} className="text-emerald-300" />
              <h2 className="font-semibold">Location intelligence</h2>
            </div>

            <div className="mb-4 space-y-3">
              <p className="text-xs text-slate-400">
                Search any city or town worldwide
              </p>

              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') searchWorld()
                  }}
                  placeholder="Tokyo, London, Nairobi..."
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={searchWorld}
                  disabled={searching || search.trim().length < 2}
                  className="rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-[#071521] disabled:opacity-50"
                >
                  {searching ? '...' : 'Search'}
                </button>
              </div>

              {searchError && (
                <p className="text-xs text-amber-300">
                  {searchError}
                </p>
              )}

              {searchResults.length > 0 && (
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-[#102734] p-2">
                  {searchResults.map(place => (
                    <button
                      type="button"
                      key={`${place.id}-${place.latitude}`}
                      onClick={() => chooseSearchResult(place)}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-200 hover:bg-emerald-400/10 hover:text-emerald-200"
                    >
                      {[place.name, place.admin1, place.country]
                        .filter(Boolean).join(', ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <WorldMap
              key={mapVersion}
              location={location}
              onPick={pickLocation}
            />

            <p className="mt-3 text-xs text-slate-400">
              Optional: click the map for precise point analysis. Locations mentioned in your question take priority.
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <MapPin size={15} />
              {location.name}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="space-y-2">
                <span className="text-xs text-slate-400">Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={latInput}
                  onChange={e => setLatInput(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs text-slate-400">Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={lngInput}
                  onChange={e => setLngInput(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <button
              onClick={applyCoordinates}
              className="mt-3 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#071521] hover:bg-emerald-300"
            >
              Analyze coordinates
            </button>

            <p className="mt-4 text-[11px] leading-5 text-slate-500">
              NASA POWER uses gridded estimates, not
              street-level observations.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0d1d2b] p-5">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-emerald-300" />
              <h3 className="font-semibold">Data grounding</h3>
            </div>

            <p className="mt-3 text-xs leading-6 text-slate-400">
              Every question triggers a backend climate-data
              query. Nemotron receives the resulting annual
              temperature and rainfall records as context.
            </p>

            {metadata && (
              <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-3 text-xs leading-6 text-slate-300">
                <p>Source: {metadata.source}</p>
                <p>Coverage: {metadata.years.start}–{metadata.years.end}</p>
                <p>Complete years: {metadata.locations?.[0]?.record_count ?? '—'}</p>
                {metadata.locations?.map((place, index) => (
                  <div key={index} className="mt-2 border-t border-white/10 pt-2">
                    <p className="text-emerald-200">{place.name}</p>
                    <p>{place.lat.toFixed(3)}, {place.lng.toFixed(3)}</p>
                    {place.is_country && (
                      <p className="mt-1 text-amber-300">
                        Representative point, not a national average
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1d2b]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-400/10 p-2">
                <BrainCircuit size={21} className="text-emerald-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">KIZUKI Intelligence</h2>
                <p className="text-[11px] text-slate-400">
                  NVIDIA-hosted climate assistant
                </p>
              </div>
            </div>

            <button
              onClick={resetChat}
              title="New conversation"
              className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            {messages.map((message, index) => (
              <Message key={index} message={message} />
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-sm text-emerald-200">
                <LoaderCircle size={17} className="animate-spin" />
                Fetching climate data and analyzing with NVIDIA...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/10 p-4">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs leading-5 text-red-200">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion}
                  disabled={loading}
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-white/10 px-3 py-2 text-left text-[11px] text-slate-300 transition hover:border-emerald-300/30 hover:text-emerald-200 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-3">
              <textarea
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Ask about Nigeria, Tokyo, Brazil vs India, or anywhere..."
                className="min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-[#081722] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/40"
              />

              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="rounded-xl bg-emerald-400 p-3.5 text-[#071521] hover:bg-emerald-300 disabled:opacity-50"
              >
                {loading
                  ? <LoaderCircle size={18} className="animate-spin" />
                  : <Send size={18} />}
              </button>
            </div>

            <p className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">
              <ShieldCheck size={13} />
              AI-generated analysis may contain errors. Verify important claims.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}