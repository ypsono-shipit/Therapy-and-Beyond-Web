import { useRef, useState } from 'react';
import { Mic, Square, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { getPlaybackUrl, useUploadVoiceJournal, useVoiceJournals } from '../../hooks/useVoiceJournals';
import { Modal } from '../../components/ui';

function pickMime() {
  const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  return types.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) ?? 'audio/webm';
}

export default function Journal() {
  const { session, consents } = useAuth();
  const patientId = session?.user.id;
  const { data: journals } = useVoiceJournals(patientId);
  const uploadJournal = useUploadVoiceJournal(patientId);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [consentSeen, setConsentSeen] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const mime = pickMime();
    const rec = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const durationSeconds = (Date.now() - startedAt.current) / 1000;
      stream.getTracks().forEach((t) => t.stop());
      if (durationSeconds > 0.5) uploadJournal.mutate({ blob, durationSeconds, mimeType: mime });
    };
    recorderRef.current = rec;
    startedAt.current = Date.now();
    rec.start();
    setRecording(true);
    timer.current = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 200);
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
    setElapsed(0);
    if (timer.current) window.clearInterval(timer.current);
  };

  const handleRecord = () => {
    if (recording) {
      stop();
      return;
    }
    if (!consentSeen) {
      setShowConsent(true);
      return;
    }
    void start();
  };

  return (
    <div className="page">
      <h1 className="page-title">Voice Journal</h1>
      <p className="page-sub">
        Speak freely.
        {consents.ai_transcription
          ? ' AI transcribes your entries for your clinician.'
          : ' AI transcription is off — turn it on in Your Data & Privacy to get text transcripts.'}
      </p>
      <div className="card" style={{ textAlign: 'center', padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>{fmt(elapsed)}</div>
        <button
          type="button"
          onClick={handleRecord}
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            background: recording ? 'var(--burgundy)' : 'var(--burgundy-dim)',
            color: recording ? 'white' : 'var(--burgundy)',
          }}
        >
          {recording ? <Square /> : <Mic />}
        </button>
        <p className="muted" style={{ marginTop: 12 }}>
          {uploadJournal.isPending ? 'Saving…' : recording ? 'Tap to stop recording' : 'Tap to start recording'}
        </p>
        {uploadJournal.isError && <p className="error">{(uploadJournal.error as Error).message}</p>}
      </div>

      <h2 style={{ fontSize: 16 }}>Past Entries</h2>
      <div className="stack" style={{ marginTop: 12 }}>
        {(journals ?? []).map((j) => (
          <div key={j.id} className="card">
            <div className="row space-between">
              <strong>{new Date(j.timestamp).toLocaleString()}</strong>
              <span className="muted">{j.audioDuration}</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ marginTop: 10 }}
              onClick={async () => {
                const url = await getPlaybackUrl(j.storagePath);
                setPlaying(url);
              }}
            >
              <Play size={14} /> Play
            </button>
            {j.transcriptionStatus === 'completed' && j.transcript && <p style={{ marginTop: 10 }}>{j.transcript}</p>}
            {(j.transcriptionStatus === 'pending' || j.transcriptionStatus === 'processing') && (
              <p className="muted">Transcribing…</p>
            )}
            {j.transcriptionStatus === 'failed' && <p className="error">Transcription failed</p>}
            {j.transcriptionStatus === 'skipped' && <p className="muted">Transcription skipped (AI consent off)</p>}
          </div>
        ))}
      </div>

      {playing && <audio src={playing} autoPlay controls style={{ width: '100%', marginTop: 16 }} />}

      <Modal open={showConsent} onClose={() => setShowConsent(false)}>
        <h3>Voice recording</h3>
        <p className="muted">Your recording is stored securely and shared only with your clinician. Transcription uses AI if you consented.</p>
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 12 }}
          onClick={() => {
            setConsentSeen(true);
            setShowConsent(false);
            void start();
          }}
        >
          Continue
        </button>
      </Modal>
    </div>
  );
}
