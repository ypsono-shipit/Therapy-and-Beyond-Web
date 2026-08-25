-- v1 feature loop: safety tools, adaptive check-ins, rateable alerts, clinician briefing inputs.
-- Applied to the shared Therapy & Beyond Supabase project.

-- ── enums ────────────────────────────────────────────────────────────────
alter type alert_severity add value if not exists 'moderate';
alter type alert_severity add value if not exists 'urgent';

alter type alert_type add value if not exists 'risk_warning';
alter type alert_type add value if not exists 'sleep_mood';
alter type alert_type add value if not exists 'work_stress';
alter type alert_type add value if not exists 'isolation';
alter type alert_type add value if not exists 'med_pattern';
