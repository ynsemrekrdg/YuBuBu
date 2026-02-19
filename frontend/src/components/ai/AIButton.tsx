import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import ChatWindow from './ChatWindow';

interface AIButtonProps {
  /** Current chapter ID if on a chapter play page */
  chapterId?: string;
}

export default function AIButton({ chapterId }: AIButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 md:bottom-20 right-4 z-[60] w-[calc(100vw-2rem)] max-w-sm"
            style={{ maxHeight: 'calc(100vh - 10rem)' }}
          >
            {/* Panel header with close */}
            <div className="flex items-center justify-between bg-gradient-to-r from-yub-500 to-yub-700 text-white px-4 py-2 rounded-t-2xl">
              <span className="text-sm font-bold flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> YuBu Asistan
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="AI panelini kapat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Chat body */}
            <div className="bg-white rounded-b-2xl shadow-2xl border border-gray-200 border-t-0 overflow-hidden"
              style={{ height: 'min(460px, calc(100vh - 14rem))' }}>
              <ChatWindow compact chapterId={chapterId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 md:bottom-6 right-6 z-[60]"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={!open ? { y: [0, -6, 0] } : {}}
        transition={{ y: { repeat: Infinity, duration: 3, ease: 'easeInOut' } }}
        aria-label={open ? 'AI panelini kapat' : 'AI Asistan ile sohbet et'}
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all ${
          open ? 'bg-gray-700' : 'bg-gradient-to-br from-yub-500 to-yub-700'
        }`}>
          {open ? <X className="w-7 h-7 text-white" /> : <MessageCircle className="w-7 h-7 text-white" />}
        </div>
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>
    </>
  );
}
