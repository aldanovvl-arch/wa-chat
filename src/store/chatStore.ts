import { create } from 'zustand';
import * as api from '../api/greenApi';
import type { Chat, Credentials, Message, Notification } from '../types';

const CREDS_KEY = 'wa-chat:creds';
const dataKey = (id: string) => `wa-chat:data:${id}`;

interface PersistedData {
  chats: Chat[];
  messages: Record<string, Message[]>;
}

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* хранилище недоступно, работаем без него */
  }
}

interface ChatState {
  creds: Credentials | null;
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;

  login: (creds: Credentials) => void;
  logout: () => void;
  openChat: (id: string | null) => void;
  createChat: (chatId: string, title: string, aliases?: string[]) => void;
  sendText: (chatId: string, text: string) => Promise<void>;
  retry: (chatId: string, messageId: string) => Promise<void>;
  handleNotification: (n: Notification) => void;
  /** Привязывает незнакомый chatId (@lid и т.п.) к существующему чату по номеру телефона */
  resolveSender: (n: Notification) => Promise<void>;
}

const savedCreds = load<Credentials>(CREDS_KEY);
const savedData = savedCreds
  ? load<PersistedData>(dataKey(savedCreds.idInstance))
  : null;

export const useChatStore = create<ChatState>((set, get) => {
  const persist = () => {
    const { creds, chats, messages } = get();
    if (creds) save(dataKey(creds.idInstance), { chats, messages });
  };

  const upsertChat = (chatId: string, title: string, last: string, ts: number) => {
    set((s) => {
      const existing = s.chats.find((c) => c.id === chatId);
      const chat: Chat = {
        id: chatId,
        title: existing?.title ?? title,
        lastMessage: last,
        updatedAt: ts,
      };
      return {
        chats: [chat, ...s.chats.filter((c) => c.id !== chatId)],
      };
    });
  };

  const patchMessage = (
    chatId: string,
    messageId: string,
    patch: Partial<Message>,
  ) => {
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map((m) =>
          m.id === messageId ? { ...m, ...patch } : m,
        ),
      },
    }));
    persist();
  };

  const deliver = async (chatId: string, localId: string, text: string) => {
    const creds = get().creds;
    if (!creds) return;
    try {
      const { idMessage } = await api.sendMessage(creds, chatId, text);
      patchMessage(chatId, localId, { id: idMessage, status: 'sent' });
    } catch {
      patchMessage(chatId, localId, { status: 'error' });
    }
  };

  return {
    creds: savedCreds,
    chats: savedData?.chats ?? [],
    messages: savedData?.messages ?? {},
    activeChatId: null,

    login: (creds) => {
      save(CREDS_KEY, creds);
      const data = load<PersistedData>(dataKey(creds.idInstance));
      set({
        creds,
        chats: data?.chats ?? [],
        messages: data?.messages ?? {},
        activeChatId: null,
      });
    },

    logout: () => {
      try {
        localStorage.removeItem(CREDS_KEY);
      } catch {
        /* ignore */
      }
      set({ creds: null, chats: [], messages: {}, activeChatId: null });
    },

    openChat: (id) => set({ activeChatId: id }),

    createChat: (chatId, title, aliases = []) => {
      set((s) =>
        s.chats.some((c) => c.id === chatId)
          ? {
              chats: s.chats.map((c) =>
                c.id === chatId
                  ? { ...c, aliases: [...new Set([...(c.aliases ?? []), ...aliases])] }
                  : c,
              ),
              activeChatId: chatId,
            }
          : {
              chats: [{ id: chatId, title, aliases, updatedAt: Date.now() }, ...s.chats],
              activeChatId: chatId,
            },
      );
      persist();
    },

    sendText: async (chatId, text) => {
      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const msg: Message = {
        id: localId,
        chatId,
        text,
        direction: 'out',
        timestamp: Date.now(),
        status: 'sending',
      };
      set((s) => ({
        messages: { ...s.messages, [chatId]: [...(s.messages[chatId] ?? []), msg] },
      }));
      upsertChat(chatId, chatId, text, msg.timestamp);
      persist();
      await deliver(chatId, localId, text);
    },

    retry: async (chatId, messageId) => {
      const msg = (get().messages[chatId] ?? []).find((m) => m.id === messageId);
      if (!msg) return;
      patchMessage(chatId, messageId, { status: 'sending' });
      await deliver(chatId, messageId, msg.text);
    },

    resolveSender: async (n) => {
      const creds = get().creds;
      const sd = n.body.senderData;
      if (!creds || !sd || n.body.typeWebhook !== 'incomingMessageReceived') return;
      const isKnown = (id?: string) =>
        !!id && get().chats.some((c) => c.id === id || c.aliases?.includes(id));
      if (isKnown(sd.chatId) || isKnown(sd.sender)) return;
      try {
        const r = await api.checkWhatsapp(creds, { chatId: sd.chatId });
        const digits = String(r.phoneNumber ?? '').match(/\d{7,15}/)?.[0];
        if (!digits) return;
        const target = get().chats.find(
          (c) =>
            c.id.startsWith(`${digits}@`) ||
            c.aliases?.some((a) => a.startsWith(`${digits}@`)) ||
            c.title.replace(/\D/g, '') === digits,
        );
        if (!target) return;
        const extra = [sd.chatId, sd.sender, r.chatId].filter((x): x is string => !!x);
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === target.id
              ? { ...c, aliases: [...new Set([...(c.aliases ?? []), ...extra])] }
              : c,
          ),
        }));
        persist();
      } catch {
        /* не удалось определить, сообщение попадёт в отдельный чат */
      }
    },

    handleNotification: (n) => {
      const { body } = n;
      if (body.typeWebhook !== 'incomingMessageReceived') return;
      const md = body.messageData;
      const sd = body.senderData;
      if (!md || !sd) return;
      const text =
        md.typeMessage === 'textMessage'
          ? md.textMessageData?.textMessage
          : md.typeMessage === 'extendedTextMessage'
            ? md.extendedTextMessageData?.text
            : undefined;
      if (!text || !body.idMessage) return;

      // собеседник может быть известен под другим идентификатором (@c.us / @lid)
      const known = get().chats.find((c) =>
        [sd.chatId, sd.sender].some(
          (id) => id && (c.id === id || c.aliases?.includes(id)),
        ),
      );
      const chatId = known?.id ?? sd.chatId;
      const existing = get().messages[chatId] ?? [];
      if (existing.some((m) => m.id === body.idMessage)) return; // дубль

      const ts = (body.timestamp ?? Math.floor(Date.now() / 1000)) * 1000;
      const msg: Message = {
        id: body.idMessage,
        chatId,
        text,
        direction: 'in',
        timestamp: ts,
      };
      set((s) => ({
        messages: { ...s.messages, [chatId]: [...existing, msg] },
      }));
      upsertChat(
        chatId,
        sd.senderContactName || sd.senderName || sd.chatName || chatId,
        text,
        ts,
      );
      persist();
    },
  };
});
