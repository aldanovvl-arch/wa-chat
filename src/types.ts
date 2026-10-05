export interface Credentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export interface Chat {
  id: string;
  title: string;
  /** Другие идентификаторы того же собеседника (@c.us / @lid) */
  aliases?: string[];
  lastMessage?: string;
  updatedAt: number;
}

export type MessageStatus = 'sending' | 'sent' | 'error';

export interface Message {
  id: string;
  chatId: string;
  text: string;
  direction: 'in' | 'out';
  timestamp: number; // ms
  status?: MessageStatus;
}

export interface CheckWhatsappResponse {
  existsWhatsapp: boolean;
  chatId?: string;
  /** например "[79876543210@c.us]" или 79876543210 */
  phoneNumber?: string | number | string[];
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface StateInstanceResponse {
  stateInstance: string;
}

export interface Notification {
  receiptId: number;
  body: {
    typeWebhook: string;
    timestamp: number;
    idMessage?: string;
    senderData?: {
      chatId: string;
      chatName?: string;
      sender?: string;
      senderName?: string;
      senderContactName?: string;
    };
    messageData?: {
      typeMessage: string;
      textMessageData?: { textMessage: string };
      extendedTextMessageData?: { text: string };
    };
  };
}
