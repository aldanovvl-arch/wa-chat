import { useEffect, useState } from 'react';
import * as api from '../api/greenApi';
import { useChatStore } from '../store/chatStore';

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    });
  });

/** Long polling очереди уведомлений GREEN-API. Возвращает текст ошибки или null. */
export function usePolling(enabled: boolean): string | null {
  const creds = useChatStore((s) => s.creds);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !creds) return;
    const ctrl = new AbortController();
    const { signal } = ctrl;

    (async () => {
      let backoff = 1000;
      while (!signal.aborted) {
        try {
          const n = await api.receiveNotification(creds, signal, 20);
          setError(null);
          backoff = 1000;
          if (!n) continue;
          await useChatStore.getState().resolveSender(n);
          useChatStore.getState().handleNotification(n);
          // удаляем всегда, иначе очередь не сдвинется
          await api.deleteNotification(creds, n.receiptId);
        } catch (e) {
          if (signal.aborted) return;
          setError(
            e instanceof Error
              ? `${e.message}. Если в инстансе включён webhook, отключите его: HTTP-очередь тогда не работает.`
              : 'Ошибка получения сообщений',
          );
          await sleep(backoff, signal);
          backoff = Math.min(backoff * 2, 30000);
        }
      }
    })();

    return () => ctrl.abort();
  }, [enabled, creds]);

  return error;
}
