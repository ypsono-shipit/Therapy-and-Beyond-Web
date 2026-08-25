import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import {
  DAILY_AI_CHAT_MESSAGE_LIMIT,
  useAIChatMessages,
  useSendAIChatMessage,
  useTodaysAIChatMessageCount,
} from '../../hooks/useAIChat';
import { Spinner } from '../../components/ui';

export default function Buddy() {
  const { session } = useAuth();
  const patientId = session?.user.id;
  const { data: messages, isLoading } = useAIChatMessages(patientId);
  const sendMessage = useSendAIChatMessage(patientId);
  const remaining = Math.max(0, DAILY_AI_CHAT_MESSAGE_LIMIT - useTodaysAIChatMessageCount(patientId));
  const [draft, setDraft] = useState('');

  const send = () => {
    if (!draft.trim() || remaining <= 0 || sendMessage.isPending) return;
    sendMessage.mutate(draft.trim());
    setDraft('');
  };

  return (
    <div className="page">
      <div className="chat-layout">
        <div className="chat-header">
          <div className="avatar avatar-sm" style={{ display: 'grid', placeItems: 'center', background: 'var(--burgundy-dim)' }}>
            <Sparkles size={16} color="var(--burgundy)" />
          </div>
          <div style={{ flex: 1 }}>
            <strong>Chat Buddy</strong>
            <div className="muted" style={{ fontSize: 12 }}>
              AI companion · clinician-moderated
            </div>
          </div>
          <span className="pill" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
            {remaining}/{DAILY_AI_CHAT_MESSAGE_LIMIT} left today
          </span>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="chat-thread">
            {(messages ?? []).length === 0 && (
              <p className="empty">
                Say hello — Chat Buddy is here to listen. This isn&apos;t a replacement for therapy, and your clinician can
                read this conversation.
              </p>
            )}
            {(messages ?? []).map((m) => (
              <div key={m.id}>
                <div className={`bubble ${m.role === 'user' ? 'mine' : 'theirs'}`}>{m.content}</div>
                {m.flagged && (
                  <p className="error" style={{ maxWidth: 320 }}>
                    We&apos;ve let your clinician know. If you need help right now: SOS 1-767 (24/7) · IMH 6389 2222
                  </p>
                )}
              </div>
            ))}
            {sendMessage.isPending && <div className="bubble theirs">…</div>}
          </div>
        )}
        {sendMessage.isError && <p className="error">{(sendMessage.error as Error).message}</p>}
        <div className="chat-input">
          <input
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={remaining > 0 ? "What's on your mind?" : "You're all set for today"}
            disabled={remaining <= 0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="btn btn-primary btn-sm" disabled={!draft.trim() || remaining <= 0 || sendMessage.isPending} onClick={send}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
