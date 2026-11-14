import { useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { analystSuggestions } from '../data/sampleData2'

const NOT_CONNECTED =
  'The AI Analyst is not connected yet. It will answer from real data once the backend and the AI model are connected in Milestone 6. I do not invent climate figures, so I have no answer for this right now.'

export default function Analyst() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello, I am the KIZUKI Climate Analyst. Ask about temperature, rainfall or vegetation in Bengaluru.' },
  ])

  function send(text) {
    const question = text.trim()
    if (!question) return
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: NOT_CONNECTED },
    ])
    setInput('')
  }

  return (
    <div>
      <PageHeader
        title="AI Climate Analyst"
        description="Ask questions about the data for the selected region and period."
        sample={false}
      />

      <div className="mb-4 flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-amber-300" />
        <p className="text-sm leading-relaxed text-amber-100/80">
          Prototype: this chat does not reach an AI model yet. Every reply is a fixed message.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          {analystSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-emerald-glow/40 hover:text-emerald-glow"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="h-96 space-y-3 overflow-y-auto rounded-xl border border-white/5 bg-navy-950/60 p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <p
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user' ? 'bg-emerald-glow/15 text-emerald-50' : 'bg-white/5 text-gray-200'
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask about climate in Bengaluru..."
            className="flex-1 rounded-xl border border-white/10 bg-navy-900 px-4 py-2.5 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-emerald-glow/50"
          />
          <button
            onClick={() => send(input)}
            aria-label="Send"
            className="rounded-xl bg-emerald-glow/90 px-4 text-navy-950 transition-colors hover:bg-emerald-glow"
          >
            <Send size={18} />
          </button>
        </div>
      </Card>
    </div>
  )
}
