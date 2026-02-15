import { motion } from 'framer-motion';
import { Users, BarChart3, BookOpen, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function ParentDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-fun font-bold text-gray-800">
            Hoş Geldiniz, {user?.name?.split(' ')[0]}! 👨‍👩‍👧
          </h1>
          <p className="text-gray-500 mt-1">Çocuğunuzun öğrenme yolculuğunu takip edin</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <Users className="w-6 h-6 text-purple-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">1</div>
            <div className="text-xs text-gray-500">Kayıtlı Çocuk</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <BarChart3 className="w-6 h-6 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">--</div>
            <div className="text-xs text-gray-500">Ortalama Skor</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <BookOpen className="w-6 h-6 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">--</div>
            <div className="text-xs text-gray-500">Tamamlanan Bölüm</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <TrendingUp className="w-6 h-6 text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">--</div>
            <div className="text-xs text-gray-500">Haftalık İlerleme</div>
          </div>
        </motion.div>

        {/* Placeholder content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 shadow-sm text-center"
        >
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">İlerleme Raporu</h3>
          <p className="text-gray-500 text-sm">
            Çocuğunuz bölümleri tamamladıkça burada detaylı ilerleme raporu ve
            AI destekli öneriler göreceksiniz.
          </p>
        </motion.div>

        {/* AI Recommendations placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 mt-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🤖</span>
            <h3 className="font-bold text-gray-800">AI Önerileri</h3>
          </div>
          <p className="text-sm text-gray-600">
            Yapay zeka analizi, çocuğunuzun güçlü ve geliştirilmesi gereken
            alanlarını belirleyerek size özel öneriler sunacak.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
