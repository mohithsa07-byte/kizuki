import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Globe2,
  Satellite,
  Activity,
  MapPinned
} from 'lucide-react'

export default function OverviewHero({
  selection,
  startYear,
  endYear
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-[30px] border border-emerald-300/15 bg-[#081824]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_45%,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-[110px]" />

      <div className="relative grid min-h-[370px] gap-8 p-7 sm:p-10 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Earth intelligence platform
            </span>
          </div>

          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            KIZUKI / MISSION CONTROL
          </p>

          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl xl:text-6xl">
            See the change.
            <span className="mt-2 block bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Understand Earth.
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400">
            Explore historical climate records, observe real
            satellite imagery, and investigate how our planet
            changes over time.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/vegetation"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-[#07151c] transition hover:bg-emerald-300"
            >
              <Satellite size={17} />
              Earth Time Machine
              <ArrowUpRight size={16} />
            </Link>

            <Link
              to="/explorer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
            >
              <Globe2 size={17} />
              Climate Explorer
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 border-t border-white/10 pt-5 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-300" />
              NASA POWER climate records
            </span>
            <span className="flex items-center gap-2">
              <Satellite size={14} className="text-emerald-300" />
              Sentinel-2 imagery
            </span>
          </div>
        </div>

        <div className="relative flex min-h-[290px] items-center justify-center">
          <div className="absolute h-[280px] w-[280px] rounded-full border border-emerald-300/15 sm:h-[330px] sm:w-[330px]" />
          <div className="absolute h-[245px] w-[245px] rounded-full border border-cyan-300/10 sm:h-[290px] sm:w-[290px]" />
          <div className="absolute h-[210px] w-[210px] rounded-full bg-emerald-500/10 blur-[70px]" />

          <div className="relative flex h-[230px] w-[230px] items-center justify-center overflow-hidden rounded-full border border-emerald-300/30 bg-[radial-gradient(circle_at_30%_25%,#2a786a,#123c52_45%,#07121e_80%)] shadow-[0_0_65px_rgba(16,185,129,0.2)] sm:h-[280px] sm:w-[280px]">
            <Globe2
              size={185}
              strokeWidth={0.65}
              className="text-emerald-200/50"
            />
          </div>

          <div className="absolute bottom-1 right-0 rounded-xl border border-emerald-300/20 bg-[#081824]/95 px-4 py-3 shadow-2xl backdrop-blur-xl sm:right-4">
            <p className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-emerald-300">
              <MapPinned size={12} />
              Active observation
            </p>

            <p className="mt-1 max-w-[170px] truncate text-sm font-semibold text-white">
              {selection.name}
            </p>

            <p className="mt-1 font-mono text-[10px] text-slate-400">
              {selection.lat.toFixed(3)}, {selection.lng.toFixed(3)}
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.025] px-7 py-4 text-xs">
        <span className="text-slate-300">
          Selected: {selection.name}
        </span>
        <span className="text-emerald-300">
          Historical period: {startYear} - {endYear}
        </span>
      </div>
    </section>
  )
}