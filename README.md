# WhatsApp Chat на GREEN-API

Простой веб-чат (React + TypeScript + Vite) для отправки и получения **текстовых** сообщений в WhatsApp через [GREEN-API](https://green-api.com/docs/).

## Запуск локально

Требуется Node 18+.

```bash
npm install
npm run dev
```

Откройте http://localhost:5173.

## Что нужно для входа

1. В личном кабинете GREEN-API создайте инстанс **WhatsApp** и авторизуйте его (QR-код).
2. Отключите webhook в настройках инстанса (с включённым webhook HTTP-очередь уведомлений не работает).
3. В форме входа введите `idInstance`, `apiTokenInstance` и `apiUrl` (например `https://1101.api.greenapi.com`; подставляется автоматически по первым 4 цифрам idInstance, поле можно править).

## Как пользоваться

1. «+ Новый чат», введите номер получателя в международном формате (`79876543210`). Номер проверяется методом `checkWhatsapp`.
2. Напишите сообщение (Enter отправляет, Shift+Enter переносит строку). Отправка: `sendMessage`.
3. Входящие приходят через `receiveNotification` (long polling) и удаляются через `deleteNotification`.

## Используемые методы API

`getStateInstance`, `checkWhatsapp`, `sendMessage`, `receiveNotification`, `deleteNotification`.

## Ограничения

- Только текстовые сообщения, остальные типы пропускаются.
- История чатов хранится в `localStorage` браузера.
- Токен хранится в `localStorage`, это учебный проект, не для продакшена.
