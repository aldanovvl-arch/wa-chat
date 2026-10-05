import { useChatStore } from './store/chatStore';
import { usePolling } from './hooks/usePolling';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

export default function App() {
  const creds = useChatStore((s) => s.creds);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const pollError = usePolling(!!creds);

  if (!creds) return <LoginForm />;

  return (
    <div className={`app ${activeChatId ? 'app--chat-open' : ''}`}>
      <Sidebar />
      <main className="main">
        {pollError && <div className="banner">{pollError}</div>}
        <ChatWindow />
      </main>
    </div>
  );
}
