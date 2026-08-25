import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { useMessages, useSendMessage } from '../../hooks/useMessages';
import { useMyClinician } from '../../hooks/useMyClinician';
import { usePatients } from '../../hooks/usePatients';
import { FALLBACK_CLINICIAN_AVATAR } from '../../types';
import { Spinner } from '../../components/ui';

export default function Messages() {
  const { session, profile } = useAuth();
  const role = profile?.role;
  const [params] = useSearchParams();
  const paramPatientId = params.get('patientId') ?? undefined;
  const { data: roster } = usePatients();
  const patientId = role === 'patient' ? session?.user.id : paramPatientId ?? roster?.[0]?.id;
  const { data: clinician } = useMyClinician(role === 'patient' ? session?.user.id : undefined);
  const partnerName = role === 'patient' ? clinician?.name : roster?.find((p) => p.id === patientId)?.name;
  const partnerAvatar = role === 'patient' ? clinician?.avatar : roster?.find((p) => p.id === patientId)?.avatar;
  const { data: messages, isLoading } = useMessages(patientId);
  const sendMessage = useSendMessage(patientId);
  const [draft, setDraft] = useState('');

  if (role === 'patient' && !clinician) {
    return (
      <div className="page empty">
        <p>Messaging is available once you link a clinician.</p>
        <Link className="btn btn-primary" to="/app/find-clinician" style={{ marginTop: 12 }}>
          Find a clinician
        </Link>
      </div>
    );
  }

  if (role === 'clinician' && !patientId) {
    return (
      <div className="page empty">
        <p>Invite a patient from the Dashboard to start messaging.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="chat-layout frost">
        <div className="chat-header">
          <img className="avatar avatar-sm" src={partnerAvatar ?? FALLBACK_CLINICIAN_AVATAR} alt="" />
          <div>
            <strong>{partnerName ?? '…'}</strong>
            <div className="muted" style={{ fontSize: 12 }}>
              Secure, encrypted messaging
            </div>
          </div>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="chat-thread">
            {(messages ?? []).length === 0 && <p className="empty">No messages yet — say hello.</p>}
            {(messages ?? []).map((m) => {
              const isMine = m.sender === role;
              return (
                <div key={m.id} className={`msg-row ${isMine ? 'right' : ''}`}>
                  <div className={`bubble ${isMine ? 'mine' : 'theirs'}`}>{m.text}</div>
                </div>
              );
            })}
          </div>
        )}
        <div className="chat-input">
          <input
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${partnerName ?? '...'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (draft.trim() && session?.user.id && role) {
                  sendMessage.mutate({ senderId: session.user.id, role, text: draft.trim() });
                  setDraft('');
                }
              }
            }}
          />
          <button
            className="btn btn-primary btn-sm"
            disabled={!draft.trim()}
            onClick={() => {
              if (!draft.trim() || !session?.user.id || !role) return;
              sendMessage.mutate({ senderId: session.user.id, role, text: draft.trim() });
              setDraft('');
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="frost-overlay">
          <div className="card" style={{ maxWidth: 360, textAlign: 'center' }}>
            <h3>Coming Soon</h3>
            <p className="muted">Live messaging with real-time delivery is on the way. Check back soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
