import { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import NewChatModal from './NewChatModal';

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
        <div>
          <button className="btn btn--small" onClick={() => setModal(true)}>
            + Новый чат
          </button>
          <button className="btn btn--small btn--ghost" onClick={logout}>
            Выйти
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
              <span className="avatar">{c.title.replace(/^\+/, '').charAt(0).toUpperCase()}</span>
              <span className="chat-item__text">
                <span className="chat-item__title">{c.title}</span>
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
