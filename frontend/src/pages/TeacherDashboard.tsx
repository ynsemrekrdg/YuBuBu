import { motion } from 'framer-motion';
import { Users, BarChart3, Brain, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-fun font-bold text-gray-800">
            Hoş Geldiniz, {user?.name?.split(' ')[0]}! 👩‍🏫
          </h1>
          <p className="text-gray-500 mt-1">Öğrencilerinizin gelişimini takip edin</p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <Users className="w-6 h-6 text-emerald-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">--</div>
            <div className="text-xs text-gray-500">Toplam Öğrenci</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <BarChart3 className="w-6 h-6 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">--</div>
            <div className="text-xs text-gray-500">Ortalama Başarı</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <BookOpen className="w-6 h-6 text-purple-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">--</div>
            <div className="text-xs text-gray-500">Aktif Bölüm</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <Brain className="w-6 h-6 text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">--</div>
            <div className="text-xs text-gray-500">AI Analiz</div>
          </div>
        </motion.div>

        {/* Student list placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 shadow-sm text-center mb-4"
        >
          <div className="text-5xl mb-4">👨‍🎓</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Öğrenci Listesi</h3>
          <p className="text-gray-500 text-sm">
            Öğrencileriniz sisteme kayıt oldukça burada listelenecek.
            Her öğrencinin detaylı ilerleme raporunu görüntüleyebileceksiniz.
          </p>
        </motion.div>

        {/* Analytics placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📈</span>
            <h3 className="font-bold text-gray-800">Grup Analizi</h3>
          </div>
          <p className="text-sm text-gray-600">
            AI destekli grup analizi ile öğrencilerinizin ortak güçlü
            ve zayıf yönlerini keşfedin. Öğretim stratejinizi buna göre uyarlayın.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
