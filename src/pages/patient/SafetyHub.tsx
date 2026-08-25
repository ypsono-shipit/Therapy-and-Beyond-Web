import { useState, type FormEvent } from 'react';
import {
  Bell,
  HeartHandshake,
  LifeBuoy,
  Phone,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { Spinner, Switch } from '../../components/ui';
import {
  EMPTY_SAFETY_PLAN,
  useAddCopingItem,
  useAddHelpfulStrategy,
  useBumpHelpfulStrategy,
  useCopingItems,
  useHelpfulStrategies,
  useDeleteCopingItem,
  useDeleteEmergencyContact,
  useDeleteHelpfulStrategy,
  useEmergencyContacts,
  useReminderPrefs,
  useSaveEmergencyContact,
  useSaveReminderPrefs,
  useSaveSafetyPlan,
  useSafetyPlan,
  type SafetyPlanDraft,
} from '../../hooks/useSafety';
import type { CopingKind, EmergencyContact, ReminderPrefs, SafetyPlan } from '../../types';

const HOTLINES = [
  { name: 'Emergency Ambulance', number: '995' },
  { name: 'SOS (Samaritans of Singapore)', number: '1-767' },
  { name: 'IMH Mental Health Helpline', number: '6389 2222' },
];

const TABS = [
  { id: 'plan', label: 'Safety plan' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'toolkit', label: 'Toolkit' },
  { id: 'worked', label: 'What worked' },
  { id: 'reminders', label: 'Reminders' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const PLAN_SECTIONS: Array<{
  key: keyof SafetyPlanDraft;
  title: string;
  hint: string;
}> = [
  { key: 'warningSigns', title: 'Warning signs', hint: 'Thoughts, feelings, or behaviours that tell me a crisis may be developing.' },
  { key: 'internalCoping', title: 'Internal coping', hint: 'Things I can do on my own to take my mind off problems without contacting anyone.' },
  { key: 'peopleAndPlaces', title: 'People and places', hint: 'People and social settings that help distract me and offer support.' },
  { key: 'professionalHelp', title: 'Professional help', hint: 'Clinicians, clinics, and crisis lines I can contact.' },
  { key: 'makeEnvironmentSafe', title: 'Make the environment safe', hint: 'Ways to reduce access to means and make my surroundings safer.' },
  { key: 'reasonsForLiving', title: 'Reasons for living', hint: 'What matters to me and keeps me going.' },
];

const COPING_KINDS: Array<{ id: CopingKind | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'grounding', label: 'Grounding' },
  { id: 'breathing', label: 'Breathing' },
  { id: 'crisis_plan', label: 'Crisis plans' },
  { id: 'playlist', label: 'Playlists' },
  { id: 'affirmation', label: 'Affirmations' },
  { id: 'distraction', label: 'Distraction' },
  { id: 'custom', label: 'Custom' },
];

const CADENCE_OPTIONS: Array<{ id: ReminderPrefs['groundingCadence']; label: string }> = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Biweekly' },
  { id: 'off', label: 'Off' },
];

function telHref(phone: string) {
  return `tel:${phone.replace(/[\s-]/g, '')}`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SafetyHub() {
  const { session } = useAuth();
  const patientId = session?.user.id;
  const [tab, setTab] = useState<TabId>('plan');

  if (!patientId) return <Spinner />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Safety</h1>
          <p className="page-sub">A place to prepare while you feel relatively stable — not something to complete in a crisis.</p>
        </div>
        <Shield color="var(--burgundy)" />
      </div>

      <div className="card" style={{ background: 'var(--danger-dim)', marginBottom: 16 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <LifeBuoy size={18} color="var(--danger)" />
          <strong>In a crisis?</strong>
        </div>
        <p className="muted" style={{ margin: '0 0 8px' }}>
          Skip this page. Immediate support is available 24/7.
        </p>
        <div className="stack">
          {HOTLINES.map((h) => (
            <a key={h.number} href={telHref(h.number)} className="row space-between" style={{ textDecoration: 'none' }}>
              <span>{h.name}</span>
              <strong>{h.number}</strong>
            </a>
          ))}
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === 'plan' && <SafetyPlanSection patientId={patientId} />}
        {tab === 'contacts' && <ContactsSection patientId={patientId} />}
        {tab === 'toolkit' && <ToolkitSection patientId={patientId} />}
        {tab === 'worked' && <WhatWorkedSection patientId={patientId} />}
        {tab === 'reminders' && <RemindersSection patientId={patientId} />}
      </div>
    </div>
  );
}

function draftFromPlan(plan: SafetyPlan | null): SafetyPlanDraft {
  if (!plan) return EMPTY_SAFETY_PLAN;
  return {
    warningSigns: plan.warningSigns,
    internalCoping: plan.internalCoping,
    peopleAndPlaces: plan.peopleAndPlaces,
    professionalHelp: plan.professionalHelp,
    makeEnvironmentSafe: plan.makeEnvironmentSafe,
    reasonsForLiving: plan.reasonsForLiving,
  };
}

function SafetyPlanSection({ patientId }: { patientId: string }) {
  const { data, isLoading } = useSafetyPlan(patientId);
  if (isLoading) return <Spinner />;
  return <SafetyPlanForm key={data?.updatedAt ?? 'new'} patientId={patientId} initial={data ?? null} />;
}

function SafetyPlanForm({
  patientId,
  initial,
}: {
  patientId: string;
  initial: SafetyPlan | null;
}) {
  const save = useSaveSafetyPlan(patientId);
  const [draft, setDraft] = useState<SafetyPlanDraft>(() => draftFromPlan(initial));

  return (
    <div className="stack">
      <div className="card" style={{ background: 'var(--gold-dim)' }}>
        <strong>Fill this in when you feel stable</strong>
        <p className="muted" style={{ margin: '6px 0 0' }}>
          A Stanley-Brown style plan is most useful when written ahead of time. In a crisis, use the numbers above or an
          emergency contact — do not wait to finish this form.
        </p>
      </div>
      {PLAN_SECTIONS.map((section) => (
        <ListEditor
          key={section.key}
          title={section.title}
          hint={section.hint}
          items={draft[section.key]}
          onChange={(items) => setDraft((prev) => ({ ...prev, [section.key]: items }))}
        />
      ))}
      {save.isError && <p className="error">{(save.error as Error).message}</p>}
      <button className="btn btn-primary" disabled={save.isPending} onClick={() => save.mutate(draft)}>
        {save.isPending ? 'Saving…' : 'Save safety plan'}
      </button>
      {initial?.updatedAt && (
        <p className="muted" style={{ textAlign: 'center' }}>
          Last saved {formatWhen(initial.updatedAt)}
        </p>
      )}
    </div>
  );
}

function ListEditor({
  title,
  hint,
  items,
  onChange,
}: {
  title: string;
  hint: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [text, setText] = useState('');

  const add = () => {
    const next = text.trim();
    if (!next) return;
    onChange([...items, next]);
    setText('');
  };

  return (
    <div className="card">
      <strong>{title}</strong>
      <p className="muted" style={{ margin: '4px 0 12px' }}>
        {hint}
      </p>
      <div className="stack">
        {items.map((item, i) => (
          <div key={`${item}-${i}`} className="row space-between">
            <span>{item}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <div className="row">
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Add an item"
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={add}>
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactsSection({ patientId }: { patientId: string }) {
  const { data: contacts = [], isLoading } = useEmergencyContacts(patientId);
  const save = useSaveEmergencyContact(patientId);
  const remove = useDeleteEmergencyContact(patientId);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setRelationship('');
    setPhone('');
    setIsPrimary(false);
  };

  const startEdit = (c: EmergencyContact) => {
    setEditing(c);
    setName(c.name);
    setRelationship(c.relationship);
    setPhone(c.phone);
    setIsPrimary(c.isPrimary);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const others = contacts.filter((c) => c.id !== editing?.id);
    save.mutate(
      { id: editing?.id, name, relationship, phone, isPrimary: others.length === 0 || isPrimary },
      { onSuccess: resetForm },
    );
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="stack">
      <p className="muted">People you trust to call when you need support. Keep at least one primary contact.</p>
      {contacts.map((c) => (
        <div key={c.id} className="card">
          <div className="row space-between">
            <div>
              <div className="row">
                <strong>{c.name}</strong>
                {c.isPrimary && (
                  <span className="pill" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
                    Primary
                  </span>
                )}
              </div>
              <div className="muted">{c.relationship || 'Contact'}</div>
              <a href={telHref(c.phone)} className="linkish">
                {c.phone}
              </a>
            </div>
            <a className="btn btn-sage btn-sm" href={telHref(c.phone)}>
              <Phone size={14} />
              Call
            </a>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            {!c.isPrimary && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={save.isPending}
                onClick={() => save.mutate({ id: c.id, name: c.name, relationship: c.relationship, phone: c.phone, isPrimary: true })}
              >
                Set primary
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(c)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate(c.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      {contacts.length === 0 && <p className="muted">No contacts yet. Add someone you trust.</p>}

      <form className="card stack" onSubmit={onSubmit}>
        <strong>{editing ? 'Edit contact' : 'Add a contact'}</strong>
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" />
        </div>
        <div>
          <label className="label">Relationship</label>
          <input className="input" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. partner, sibling, friend" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. 9123 4567" inputMode="tel" />
        </div>
        <div className="row space-between">
          <div>
            <strong>Primary contact</strong>
            <div className="muted">Shown first in a crisis.</div>
          </div>
          <Switch on={contacts.filter((c) => c.id !== editing?.id).length === 0 || isPrimary} onToggle={() => setIsPrimary((v) => !v)} />
        </div>
        {save.isError && <p className="error">{(save.error as Error).message}</p>}
        <div className="row">
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save contact' : 'Add contact'}
          </button>
          {editing && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ToolkitSection({ patientId }: { patientId: string }) {
  const { data: items = [], isLoading } = useCopingItems(patientId);
  const add = useAddCopingItem(patientId);
  const remove = useDeleteCopingItem(patientId);
  const [filter, setFilter] = useState<CopingKind | 'all'>('all');
  const [kind, setKind] = useState<CopingKind>('custom');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');

  const shown = items.filter((i) => filter === 'all' || i.kind === filter);

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    add.mutate(
      { kind, title, body, url: url.trim() || null },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
          setUrl('');
          setKind('custom');
        },
      },
    );
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="stack">
      <p className="muted">Grounding, breathing, and other tools you can use between sessions. Presets appear if your toolkit is empty.</p>
      <div className="tabs">
        {COPING_KINDS.map((k) => (
          <button key={k.id} type="button" className={`tab ${filter === k.id ? 'active' : ''}`} onClick={() => setFilter(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      {shown.map((item) => (
        <div key={item.id} className="card">
          <div className="row" style={{ marginBottom: 6 }}>
            <span className="pill" style={{ background: 'var(--burgundy-dim)', color: 'var(--burgundy)' }}>
              {item.kind.replace('_', ' ')}
            </span>
            {item.isPreset && (
              <span className="pill" style={{ background: 'var(--sage-dim)', color: 'var(--sage)' }}>
                Preset
              </span>
            )}
          </div>
          <h3 style={{ margin: '4px 0 6px' }}>{item.title}</h3>
          {item.body && <p className="muted">{item.body}</p>}
          {item.url && (
            <a className="linkish" href={item.url} target="_blank" rel="noreferrer">
              Open link
            </a>
          )}
          <div className="row" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-danger btn-sm" disabled={remove.isPending} onClick={() => remove.mutate(item.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      {shown.length === 0 && <p className="muted">Nothing in this category yet.</p>}

      <form className="card stack" onSubmit={onAdd}>
        <strong>Add to your toolkit</strong>
        <div>
          <label className="label">Type</label>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as CopingKind)}>
            {COPING_KINDS.filter((k) => k.id !== 'all').map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Walk around the block" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} placeholder="How this helps you, or the steps to follow" />
        </div>
        <div>
          <label className="label">Link (optional)</label>
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </div>
        {add.isError && <p className="error">{(add.error as Error).message}</p>}
        <button className="btn btn-primary" type="submit" disabled={add.isPending}>
          {add.isPending ? 'Adding…' : 'Add item'}
        </button>
      </form>
    </div>
  );
}

function WhatWorkedSection({ patientId }: { patientId: string }) {
  const { data: items = [], isLoading } = useHelpfulStrategies(patientId);
  const add = useAddHelpfulStrategy(patientId);
  const bump = useBumpHelpfulStrategy(patientId);
  const remove = useDeleteHelpfulStrategy(patientId);
  const [text, setText] = useState('');

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    add.mutate(text, { onSuccess: () => setText('') });
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="stack">
      <div className="row">
        <HeartHandshake size={18} color="var(--sage)" />
        <p className="muted" style={{ margin: 0 }}>
          Strategies that actually helped you. Tap “I used this” to keep a count.
        </p>
      </div>
      {items.map((item) => (
        <div key={item.id} className="card">
          <strong>{item.strategy}</strong>
          <p className="muted" style={{ margin: '6px 0 12px' }}>
            Used {item.timesUsed} {item.timesUsed === 1 ? 'time' : 'times'} · Last {formatWhen(item.lastUsedAt)}
          </p>
          <div className="row">
            <button type="button" className="btn btn-sage btn-sm" disabled={bump.isPending} onClick={() => bump.mutate(item)}>
              I used this
            </button>
            <button type="button" className="btn btn-danger btn-sm" disabled={remove.isPending} onClick={() => remove.mutate(item.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="muted">Nothing logged yet. When something helps, add it here.</p>}
      <form className="card stack" onSubmit={onAdd}>
        <label className="label">What worked</label>
        <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. 10-minute walk after a hard session" />
        {add.isError && <p className="error">{(add.error as Error).message}</p>}
        <button className="btn btn-primary" type="submit" disabled={add.isPending}>
          {add.isPending ? 'Adding…' : 'Add strategy'}
        </button>
      </form>
    </div>
  );
}

function RemindersSection({ patientId }: { patientId: string }) {
  const { hasClinician } = useAuth();
  const { data: prefs, isLoading } = useReminderPrefs(patientId);
  const save = useSaveReminderPrefs(patientId);

  if (isLoading || !prefs) return <Spinner />;

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <Bell size={18} color="var(--burgundy)" />
          <strong>Grounding reminders</strong>
        </div>
        <p className="muted">How often should we nudge you to practise a grounding or breathing exercise? Weekly is the default.</p>
        <div className="row" style={{ marginTop: 14, flexWrap: 'wrap' }}>
          {CADENCE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="btn btn-sm"
              style={{
                background: prefs.groundingCadence === opt.id ? 'var(--burgundy)' : 'var(--surface)',
                color: prefs.groundingCadence === opt.id ? 'white' : 'var(--charcoal)',
              }}
              disabled={save.isPending}
              onClick={() => save.mutate(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {save.isError && <p className="error">{(save.error as Error).message}</p>}
        {save.isPending && <p className="muted">Saving…</p>}
      </div>
      {hasClinician && (
        <div className="card" style={{ background: 'var(--sage-dim)' }}>
          <strong>Your clinician can also change this</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            Because you are linked with a clinician, they may update this cadence too. Last set by{' '}
            {prefs.setBy === 'clinician' ? 'your clinician' : 'you'}.
          </p>
        </div>
      )}
    </div>
  );
}
