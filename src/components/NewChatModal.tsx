import { useState } from 'react';
import { checkWhatsapp } from '../api/greenApi';
import { useChatStore } from '../store/chatStore';

export default function NewChatModal({ onClose }: { onClose: () => void }) {
  const creds = useChatStore((s) => s.creds)!;
  const chats = useChatStore((s) => s.chats);
  const createChat = useChatStore((s) => s.createChat);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return setError('Введите номер в международном формате, например 79876543210');
    }
    setLoading(true);
    try {
      const r = await checkWhatsapp(creds, Number(digits));
      if (!r.existsWhatsapp) return setError('Аккаунт WhatsApp с таким номером не найден');
      // chatId из ответа может быть @lid, а входящие приходить с @c.us: запоминаем оба
      const phoneId = `${digits}@c.us`;
      const id = r.chatId || phoneId;
      const known = chats.find((c) => c.id === id || c.aliases?.includes(id) || c.id === phoneId);
      createChat(known?.id ?? id, known?.title ?? `+${digits}`, [id, phoneId]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка проверки номера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <form className="modal__card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Новый чат</h2>
        <label>
          Номер телефона получателя
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="79876543210"
            inputMode="tel"
            autoFocus
          />
        </label>
        {error && <div className="error">{error}</div>}
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Отмена
          </button>
          <button className="btn" disabled={loading}>
            {loading ? 'Проверяем…' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}
