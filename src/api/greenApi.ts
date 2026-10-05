import type {
  CheckWhatsappResponse,
  Credentials,
  Notification,
  SendMessageResponse,
  StateInstanceResponse,
} from '../types';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** apiUrl по умолчанию: первые 4 цифры idInstance -> https://4100.api.greenapi.com */
export function guessApiUrl(idInstance: string): string {
  const prefix = idInstance.trim().slice(0, 4);
  return prefix.length === 4 ? `https://${prefix}.api.greenapi.com` : '';
}

function url(c: Credentials, method: string, suffix = ''): string {
  const base = c.apiUrl.replace(/\/+$/, '');
  return `${base}/waInstance${c.idInstance}/${method}/${c.apiTokenInstance}${suffix}`;
}

function explain(status: number): string {
  switch (status) {
    case 400:
      return 'Некорректный запрос';
    case 401:
    case 403:
      return 'Неверные idInstance или apiTokenInstance';
    case 429:
      return 'Слишком много запросов, попробуйте позже';
    case 466:
      return 'Исчерпан лимит тарифа';
    default:
      return status >= 500
        ? `Ошибка сервера (${status})`
        : `Ошибка запроса (${status})`;
  }
}

async function request<T>(
  input: string,
  init?: RequestInit,
): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError('Нет соединения с сервером (проверьте apiUrl и сеть)');
  }
  if (!res.ok) throw new ApiError(explain(res.status), res.status);
  const text = await res.text();
  if (!text || text === 'null') return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function getStateInstance(c: Credentials): Promise<string> {
  const r = await request<StateInstanceResponse>(url(c, 'getStateInstance'));
  return r?.stateInstance ?? 'unknown';
}

export async function checkWhatsapp(
  c: Credentials,
  target: number | { chatId: string },
): Promise<CheckWhatsappResponse> {
  const body = typeof target === 'number' ? { phoneNumber: target } : target;
  const r = await request<CheckWhatsappResponse>(url(c, 'checkWhatsapp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r ?? { existsWhatsapp: false };
}

export async function sendMessage(
  c: Credentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  const r = await request<SendMessageResponse>(url(c, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  });
  if (!r?.idMessage) throw new ApiError('Сообщение не отправлено');
  return r;
}

export async function receiveNotification(
  c: Credentials,
  signal?: AbortSignal,
  timeout = 20,
): Promise<Notification | null> {
  return request<Notification>(
    url(c, 'receiveNotification', `?receiveTimeout=${timeout}`),
    { signal },
  );
}

export async function deleteNotification(
  c: Credentials,
  receiptId: number,
): Promise<void> {
  await request(url(c, 'deleteNotification', `/${receiptId}`), {
    method: 'DELETE',
  });
}
