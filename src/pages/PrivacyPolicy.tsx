import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  { title: '1. What we collect', body: 'Mood, anxiety, and energy check-ins; sleep duration and quality; medication adherence; optional notes and significant events; and voice journal recordings and their AI-generated transcripts.' },
  { title: '2. Why we collect it', body: 'Solely to generate your clinician’s pre-session brief and support continuity of care between appointments. We do not use your data for marketing or research, and do not sell or share it with third parties.' },
  { title: '3. Who can see it', body: 'Only you and your assigned clinician. Practice staff acting under your clinician’s direction may access records as permitted under the Healthcare Services Act (HCSA).' },
  { title: '4. Our role as Data Intermediary', body: 'Therapy & Beyond processes patient data on behalf of your clinician’s practice under a Data Processing Agreement (DPA). Your practice remains the Data Controller under the PDPA and HCSA.' },
  { title: '5. Your rights', body: 'Under the PDPA, you may request a copy of your data, request correction of inaccurate data, and withdraw consent or request deletion at any time. Requests are handled within 30 calendar days.' },
  { title: '6. Retention', body: 'Clinical records are retained in line with HCSA requirements — generally at least 6 years — or until you or your clinician request deletion, whichever is later.' },
  { title: '7. Security', body: 'Data is encrypted at rest and in transit, hosted in Singapore data centres, and protected by role-based access controls with full audit logging.' },
  { title: '8. Overseas transfer', body: 'We do not transfer personal data outside Singapore without safeguards that meet PDPA’s comparable-protection standard.' },
  { title: '9. AI features', body: 'AI is used to transcribe voice notes and surface themes to help your clinician prepare. AI-generated summaries do not diagnose conditions or replace professional clinical assessment.' },
  { title: '10. Contact', body: 'For data requests or privacy concerns, contact our Data Protection Officer at dpo@therapyandbeyond.com.' },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ padding: 24 }}>
      <button type="button" className="muted" style={{ fontWeight: 600 }} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h1 className="page-title" style={{ marginTop: 16 }}>
        Privacy Policy
      </h1>
      <div className="stack" style={{ marginTop: 20 }}>
        {SECTIONS.map((s) => (
          <div key={s.title} className="card">
            <strong>{s.title}</strong>
            <p className="muted" style={{ margin: '8px 0 0' }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
