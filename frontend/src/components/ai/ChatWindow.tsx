import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { useAIChat } from '../../hooks/useAI';
import ChatMessage from './ChatMessage';
import type { ChatMessage as ChatMsg } from '../../types';

interface ChatWindowProps {
  roleContext?: string;
}

const quickQuestions = [
  'Bu konuyu anlamadım, bana yardım eder misin?',
  'Bir ipucu verir misin?',
  'Bunu daha basit anlatır mısın?',
  'Aferin mi diyorsun? 😊',
];

export default function ChatWindow({ roleContext = 'student' }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      text: 'Merhaba! 🎓 Ben YuBuBu AI asistanıyım. Sana öğrenmende yardımcı olmak için buradayım. Ne sormak istersin?',
      sender: 'ai',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatMutation = useAIChat();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: ChatMsg = {
      id: `user-${Date.now()}`,
      text: msg,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    inputRef.current?.focus();

    try {
      const res = await chatMutation.mutateAsync({ message: msg, role_context: roleContext });
      const aiMsg: ChatMsg = {
        id: res.id,
        text: res.response,
        sender: 'ai',
        timestamp: res.timestamp,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMsg = {
        id: `err-${Date.now()}`,
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar dene. 😔',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yub-500 to-yub-700 text-white px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-sm">YuBuBu AI Asistan</h2>
          <p className="text-xs text-white/80">Her zaman yardıma hazır!</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} text={msg.text} sender={msg.sender} timestamp={msg.timestamp} />
        ))}
        {chatMutation.isPending && (
          <div className="flex items-center gap-2 text-gray-400 text-sm ml-10">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Düşünüyor...</span>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            disabled={chatMutation.isPending}
            className="shrink-0 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-yub-50 hover:border-yub-300 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mesajını yaz..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yub-400 focus:bg-white transition-all"
            disabled={chatMutation.isPending}
            aria-label="Mesaj yaz"
          />
          <button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="p-3 bg-yub-500 text-white rounded-xl hover:bg-yub-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Mesaj gönder"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
