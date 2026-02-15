import { motion } from 'framer-motion';
import ChatWindow from '../components/ai/ChatWindow';

export default function AIChat() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <ChatWindow />
      </motion.div>
    </div>
  );
}
