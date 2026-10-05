import { useState } from 'react';
import { getStateInstance, guessApiUrl } from '../api/greenApi';
import { useChatStore } from '../store/chatStore';

export default function LoginForm() {
  const login = useChatStore((s) => s.login);
  const [idInstance, setId] = useState('');
  const [token, setToken] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [urlTouched, setUrlTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onId = (v: string) => {
    setId(v);
    if (!urlTouched) setApiUrl(guessApiUrl(v));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const creds = {
      idInstance: idInstance.trim(),
      apiTokenInstance: token.trim(),
      apiUrl: apiUrl.trim(),
    };
    if (!/^\d+$/.test(creds.idInstance)) return setError('idInstance должен состоять из цифр');
    if (!creds.apiTokenInstance) return setError('Введите apiTokenInstance');
    if (!/^https?:\/\//.test(creds.apiUrl)) return setError('apiUrl должен начинаться с https://');

    setLoading(true);
    try {
      const state = await getStateInstance(creds);
      if (state !== 'authorized') {
        setError(`Инстанс не авторизован (состояние: ${state}). Авторизуйте WhatsApp в личном кабинете.`);
        return;
      }
      login(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40"><path fill="#fff" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.4.1.1.1.6-.1 1.2z" /></svg>
        </div>
        <h1>Вход в чат</h1>
        <p className="muted">Данные из личного кабинета GREEN-API (инстанс WhatsApp)</p>
        <label>
          idInstance
          <input value={idInstance} onChange={(e) => onId(e.target.value)} inputMode="numeric" autoFocus />
        </label>
        <label>
          apiTokenInstance
          <input value={token} onChange={(e) => setToken(e.target.value)} type="password" autoComplete="off" />
        </label>
        <label>
          apiUrl
          <input
            value={apiUrl}
            onChange={(e) => {
              setApiUrl(e.target.value);
              setUrlTouched(true);
            }}
            placeholder="https://1101.api.greenapi.com"
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
