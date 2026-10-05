import { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import NewChatModal from './NewChatModal';
import Avatar from './Avatar';

const fmt = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export default function Sidebar() {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const openChat = useChatStore((s) => s.openChat);
  const logout = useChatStore((s) => s.logout);
  const [modal, setModal] = useState(false);

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <strong>Чаты</strong>
        <div className="sidebar__actions">
          <button className="icon-btn" onClick={() => setModal(true)} title="Новый чат" aria-label="Новый чат">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z" /></svg>
          </button>
          <button className="icon-btn" onClick={logout} title="Выйти" aria-label="Выйти">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3h9zm3-10H11a2 2 0 0 0-2 2v3h2V5h8v14h-8v-3H9v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" /></svg>
          </button>
        </div>
      </header>
      <ul className="chat-list">
        {chats.length === 0 && <li className="empty">Нет чатов. Создайте новый.</li>}
        {chats.map((c) => (
          <li key={c.id}>
            <button
              className={`chat-item ${c.id === activeChatId ? 'chat-item--active' : ''}`}
              onClick={() => openChat(c.id)}
            >
              <Avatar />
              <span className="chat-item__text">
                <span className="chat-item__top">
                  <span className="chat-item__title">{c.title}</span>
                  <span className="chat-item__time">{c.lastMessage ? fmt(c.updatedAt) : ''}</span>
                </span>
                <span className="chat-item__last">{c.lastMessage ?? 'Нет сообщений'}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {modal && <NewChatModal onClose={() => setModal(false)} />}
    </aside>
  );
}
