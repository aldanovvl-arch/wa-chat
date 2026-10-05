import type { Message } from '../types';
import { useChatStore } from '../store/chatStore';

function Status({ status }: { status?: Message['status'] }) {
  if (status === 'sending')
    return (
      <svg className="tick" viewBox="0 0 16 16" width="14" height="14" aria-label="отправляется">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  if (status === 'error')
    return <span className="tick tick--error" aria-label="ошибка">!</span>;
  return (
    <svg className="tick tick--sent" viewBox="0 0 16 11" width="16" height="11" aria-label="отправлено">
      <path d="M11.07.65 4.9 7.7 2.2 5.1l-.9.95 3.65 3.5L12 1.6z" fill="currentColor" />
    </svg>
  );
}

export default function MessageBubble({ m }: { m: Message }) {
  const retry = useChatStore((s) => s.retry);
  const time = new Date(m.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className={`row row--${m.direction}`}>
      <div className={`bubble bubble--${m.direction}`}>
        <span className="bubble__text">{m.text}</span>
        <span className="bubble__meta">
          {time}
          {m.direction === 'out' && <Status status={m.status} />}
        </span>
        {m.status === 'error' && (
          <button className="link" onClick={() => retry(m.chatId, m.id)}>
            Не отправлено. Повторить
          </button>
        )}
      </div>
    </div>
  );
}
