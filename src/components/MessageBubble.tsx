import type { Message } from '../types';
import { useChatStore } from '../store/chatStore';

export default function MessageBubble({ m }: { m: Message }) {
  const retry = useChatStore((s) => s.retry);
  const time = new Date(m.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className={`bubble bubble--${m.direction}`}>
      <span className="bubble__text">{m.text}</span>
      <span className="bubble__meta">
        {time}
        {m.status === 'sending' && ' · отправка…'}
        {m.status === 'error' && (
          <>
            {' · '}
            <button className="link" onClick={() => retry(m.chatId, m.id)}>
              не отправлено, повторить
            </button>
          </>
        )}
      </span>
    </div>
  );
}
