import { useState } from 'react';

const CATEGORIES = ['All', 'Anxiety', 'Sleep', 'Mindfulness', 'CBT'];
const RESOURCES = [
  { id: '1', category: 'Anxiety', title: 'Box Breathing Technique', desc: 'A 4-step breathing exercise for acute anxiety management.', duration: '5 min', type: 'Exercise' },
  { id: '2', category: 'CBT', title: 'Thought Record Sheet', desc: 'Identify and challenge cognitive distortions using a structured CBT worksheet.', duration: '10 min', type: 'Worksheet' },
  { id: '3', category: 'Sleep', title: 'Sleep Hygiene Guide', desc: 'Evidence-based practices to improve sleep quality and duration.', duration: '3 min read', type: 'Guide' },
  { id: '4', category: 'Mindfulness', title: '5-4-3-2-1 Grounding', desc: 'A sensory grounding technique for managing dissociation and panic episodes.', duration: '7 min', type: 'Exercise' },
  { id: '5', category: 'Anxiety', title: 'Progressive Muscle Relaxation', desc: 'Release physical tension by systematically tensing and releasing muscle groups.', duration: '15 min', type: 'Exercise' },
  { id: '6', category: 'CBT', title: 'Catastrophizing Worksheet', desc: 'Examine and challenge worst-case thinking patterns.', duration: '12 min', type: 'Worksheet' },
  { id: '7', category: 'Mindfulness', title: 'Guided Body Scan', desc: 'Develop body awareness through mindful attention.', duration: '20 min', type: 'Audio' },
  { id: '8', category: 'Sleep', title: 'Sleep Restriction Protocol', desc: 'A clinical protocol for addressing insomnia through controlled sleep scheduling.', duration: '5 min read', type: 'Guide' },
];
const HOTLINES = [
  { name: 'Emergency Ambulance', number: '995' },
  { name: 'SOS (Samaritans of Singapore)', number: '1-767' },
  { name: 'IMH Mental Health Helpline', number: '6389 2222' },
];

export default function Resources() {
  const [active, setActive] = useState('All');
  const filtered = RESOURCES.filter((r) => active === 'All' || r.category === active);
  return (
    <div className="page">
      <h1 className="page-title">Resources</h1>
      <p className="page-sub">Clinician-curated tools and exercises for your wellbeing.</p>
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
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={`tab ${active === c ? 'active' : ''}`} onClick={() => setActive(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="stack" style={{ marginTop: 14 }}>
        {filtered.map((r) => (
          <div key={r.id} className="card">
            <span className="pill" style={{ background: 'var(--burgundy-dim)', color: 'var(--burgundy)' }}>
              {r.type}
            </span>
            <h3 style={{ margin: '8px 0 4px' }}>{r.title}</h3>
            <p className="muted">{r.desc}</p>
            <div className="muted">{r.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
