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
