import { motion } from 'framer-motion';
import { Bot, User, Volume2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { yubuSpeak, browserSpeak } from '../../utils/accessibility';

interface ChatMessageProps {
  text: string;
  sender: 'user' | 'ai';
  timestamp?: string;
}

export default function ChatMessage({ text, sender, timestamp }: ChatMessageProps) {
  const isUser = sender === 'user';
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (speaking) return;
    setSpeaking(true);
    try {
      // AI mesajları için YuBu TTS kullan
      await yubuSpeak(text, 'neutral');
    } catch {
      // Son çare: tarayıcı sesi
      browserSpeak(text);
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-3`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-yub-500 to-yub-700'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-between'}`}>
          {timestamp && (
            <span className={`text-[10px] ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
              {new Date(timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {!isUser && (
            <button
              onClick={handleSpeak}
              disabled={speaking}
              className={`transition-colors ${speaking ? 'text-yub-500' : 'text-gray-400 hover:text-gray-600'} disabled:opacity-70`}
              aria-label="YuBu sesiyle dinle"
              title="YuBu sesiyle dinle"
            >
              {speaking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
