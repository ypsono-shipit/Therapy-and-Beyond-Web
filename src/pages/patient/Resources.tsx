import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { RESOURCE_CATEGORIES, RESOURCES } from '../../data/resources';

const HOTLINES = [
  { name: 'Emergency Ambulance', number: '995' },
  { name: 'SOS (Samaritans of Singapore)', number: '1-767' },
  { name: 'IMH Mental Health Helpline', number: '6389 2222' },
];

export default function Resources() {
  const [active, setActive] = useState<(typeof RESOURCE_CATEGORIES)[number]>('All');
  const filtered = RESOURCES.filter((r) => active === 'All' || r.category === active);
  return (
    <div className="page">
      <h1 className="page-title">Resources</h1>
      <p className="page-sub">Tap a card to be guided through the exercise, one step at a time.</p>
      <div className="card" style={{ background: 'var(--danger-dim)', margin: '16px 0' }}>
        <strong>In a crisis?</strong>
        <p className="muted">Immediate support is available 24/7</p>
        <div className="stack" style={{ marginTop: 8 }}>
          {HOTLINES.map((h) => (
            <a key={h.number} href={`tel:${h.number.replace(/\s/g, '')}`} className="row space-between" style={{ textDecoration: 'none' }}>
              <span>{h.name}</span>
              <strong>{h.number}</strong>
            </a>
          ))}
        </div>
      </div>
      <div className="tabs">
        {RESOURCE_CATEGORIES.map((c) => (
          <button key={c} type="button" className={`tab ${active === c ? 'active' : ''}`} onClick={() => setActive(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="stack" style={{ marginTop: 14 }}>
        {filtered.map((r) => (
          <Link key={r.id} to={`/app/resources/${r.id}`} className="card row" style={{ textDecoration: 'none', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <span className="pill" style={{ background: 'var(--burgundy-dim)', color: 'var(--burgundy)' }}>
                {r.type}
              </span>
              <h3 style={{ margin: '8px 0 4px' }}>{r.title}</h3>
              <p className="muted" style={{ margin: 0 }}>
                {r.desc}
              </p>
              <div className="muted" style={{ marginTop: 6 }}>
                {r.duration} · {r.steps.length} steps
              </div>
            </div>
            <ChevronRight size={18} color="var(--dimmed)" style={{ marginTop: 8, flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
