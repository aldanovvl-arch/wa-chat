import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import MessageBubble from './MessageBubble';

const MAX_LEN = 20000;
const EMPTY: never[] = [];

export default function ChatWindow() {
  const activeChatId = useChatStore((s) => s.activeChatId);
  const chat = useChatStore((s) => s.chats.find((c) => c.id === s.activeChatId));
  const messages = useChatStore((s) => (s.activeChatId ? s.messages[s.activeChatId] : undefined)) ?? EMPTY;
  const sendText = useChatStore((s) => s.sendText);
  const openChat = useChatStore((s) => s.openChat);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, activeChatId]);

  if (!activeChatId || !chat) {
    return <div className="placeholder">Выберите чат или создайте новый</div>;
  }

  const send = () => {
    const t = text.trim();
    if (!t || t.length > MAX_LEN) return;
    setText('');
    stickRef.current = true;
    void sendText(activeChatId, t);
  };

  return (
    <section className="chat">
      <header className="chat__header">
        <button className="back" onClick={() => openChat(null)} aria-label="Назад">
          ←
        </button>
        <strong>{chat.title}</strong>
      </header>
      <div
        className="chat__messages"
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {messages.length === 0 && <div className="empty">Нет сообщений</div>}
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
      </div>
      <form
        className="chat__input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          value={text}
          rows={1}
          maxLength={MAX_LEN}
          placeholder="Сообщение"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="btn" disabled={!text.trim()}>
          Отправить
        </button>
      </form>
    </section>
  );
}
