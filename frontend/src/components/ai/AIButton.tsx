import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export default function AIButton() {
  return (
    <Link to="/ai-chat" aria-label="AI Asistan ile sohbet et">
      <motion.div
        className="fixed bottom-20 md:bottom-6 right-6 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ y: { repeat: Infinity, duration: 3, ease: 'easeInOut' } }}
      >
        <div className="w-14 h-14 bg-gradient-to-br from-yub-500 to-yub-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </motion.div>
    </Link>
  );
}
