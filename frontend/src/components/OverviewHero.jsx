import { Link } from 'react-router-dom'
import { ArrowUpRight, Satellite, Globe2 } from 'lucide-react'

export default function OverviewHero({
  selection,
  startYear,
  endYear
}) {
  return (
    <section className="obs-hero">
      <div className="obs-hero-top">
        <span>KIZUKI / EARTH OBSERVATORY</span>
        <span>RESEARCH WORKSPACE — 001</span>
      </div>

      <div className="obs-hero-content">
        <div>
          <p className="obs-kicker">PLANETARY INTELLIGENCE</p>

          <h1 className="obs-hero-title">
            Earth, observed.
          </h1>

          <p className="obs-hero-description">
            Investigate climate records, satellite observations,
            and environmental change through measurable evidence.
          </p>

          <div className="obs-hero-actions">
            <Link to="/vegetation" className="obs-action-primary">
              <Satellite size={16} />
              Earth observation
              <ArrowUpRight size={15} />
            </Link>

            <Link to="/explorer" className="obs-action-secondary">
              <Globe2 size={16} />
              Climate explorer
            </Link>
          </div>
        </div>

        <div className="obs-observation-panel">
          <div className="obs-panel-label">
            ACTIVE OBSERVATION
          </div>

          <div className="obs-observation-name">
            {selection.name}
          </div>

          <div className="obs-observation-coordinate">
            {selection.lat.toFixed(4)}° N/S
            {' / '}
            {selection.lng.toFixed(4)}° E/W
          </div>

          <div className="obs-observation-rule" />

          <div className="obs-observation-row">
            <span>CLIMATE PERIOD</span>
            <strong>{startYear} — {endYear}</strong>
          </div>

          <div className="obs-observation-row">
            <span>WORKSPACE</span>
            <strong>GLOBAL</strong>
          </div>

          <div className="obs-observation-row">
            <span>DATA CONTEXT</span>
            <strong>EARTH SYSTEMS</strong>
          </div>
        </div>
      </div>

      <div className="obs-hero-bottom">
        <span>CLIMATE RECORDS / EARTH OBSERVATION</span>
        <span>SEE THE CHANGE. UNDERSTAND THE CAUSE.</span>
      </div>
    </section>
  )
}