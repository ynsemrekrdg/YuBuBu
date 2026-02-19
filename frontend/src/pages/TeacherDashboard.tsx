import { motion } from 'framer-motion';
import { Users, BarChart3, Brain, BookOpen, RefreshCw, GraduationCap, Flame, Star, Trophy } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth.service';
import { useState, useEffect, useCallback } from 'react';
import type { ChildInfo } from '../types';

const difficultyLabels: Record<string, string> = {
  dyslexia: '📖 Disleksi',
  dysgraphia: '✏️ Disgrafi',
  dyscalculia: '🔢 Diskalkuli',
};

const difficultyColors: Record<string, string> = {
  dyslexia: 'bg-blue-100 text-blue-700',
  dysgraphia: 'bg-purple-100 text-purple-700',
  dyscalculia: 'bg-orange-100 text-orange-700',
};

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<ChildInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.getMyStudents();
      setStudents(res.students);
    } catch (err: any) {
      console.error('Öğrenci listesi alınamadı:', err);
      setError('Öğrenci listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Compute stats
  const totalStudents = students.length;
  const avgScore = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + s.total_score, 0) / totalStudents)
    : 0;
  const avgLevel = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + s.current_level, 0) / totalStudents * 10) / 10
    : 0;
  const activeStreaks = students.filter(s => s.streak_days > 0).length;

  // Group by difficulty
  const difficultyGroups = students.reduce((acc, s) => {
    acc[s.learning_difficulty] = (acc[s.learning_difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-fun font-bold text-gray-800">
              Hoş Geldiniz, {user?.name?.split(' ')[0]}! 👩‍🏫
            </h1>
            <p className="text-gray-500 mt-1">Öğrencilerinizin gelişimini takip edin</p>
          </div>
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            title="Yenile"
          >
            <RefreshCw className={`w-5 h-5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
            <div className="text-2xl font-bold text-gray-800">{totalStudents}</div>
            <div className="text-xs text-gray-500">Toplam Öğrenci</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <BarChart3 className="w-6 h-6 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">{avgScore}</div>
            <div className="text-xs text-gray-500">Ortalama Puan</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <BookOpen className="w-6 h-6 text-purple-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">{avgLevel}</div>
            <div className="text-xs text-gray-500">Ortalama Seviye</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <Flame className="w-6 h-6 text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-gray-800">{activeStreaks}</div>
            <div className="text-xs text-gray-500">Aktif Seri</div>
          </div>
        </motion.div>

        {/* Difficulty breakdown */}
        {totalStudents > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-4 shadow-sm mb-6"
          >
            <h3 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Öğrenme Güçlüğü Dağılımı
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(difficultyGroups).map(([diff, count]) => (
                <span key={diff} className={`px-3 py-1.5 rounded-full text-sm font-medium ${difficultyColors[diff] || 'bg-gray-100 text-gray-700'}`}>
                  {difficultyLabels[diff] || diff} · {count} öğrenci
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={fetchStudents} className="mt-2 text-sm text-red-700 underline">
              Tekrar dene
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Öğrenciler yükleniyor...</p>
          </div>
        )}

        {/* Student list */}
        {!loading && students.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-sm text-center mb-4"
          >
            <div className="text-5xl mb-4">👨‍🎓</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Henüz Öğrenciniz Yok</h3>
            <p className="text-gray-500 text-sm">
              Veliler çocuklarını kaydederken sizi öğretmen olarak seçtiğinde
              öğrencileriniz burada listelenecek.
            </p>
          </motion.div>
        )}

        {!loading && students.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Öğrenci Listesi ({totalStudents})
            </h3>
            <div className="space-y-3">
              {students.map((student, idx) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800 text-base">{student.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[student.learning_difficulty] || 'bg-gray-100 text-gray-700'}`}>
                          {difficultyLabels[student.learning_difficulty] || student.learning_difficulty}
                        </span>
                        {student.grade && (
                          <span className="text-xs text-gray-400">{student.grade}. sınıf</span>
                        )}
                        <span className="text-xs text-gray-400">· {student.age} yaş</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Trophy className="w-4 h-4" />
                        <span className="font-bold text-sm">Seviye {student.current_level}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-emerald-50 rounded-xl p-2 text-center">
                      <Star className="w-4 h-4 text-emerald-500 mx-auto mb-0.5" />
                      <div className="text-sm font-bold text-gray-800">{student.total_score}</div>
                      <div className="text-[10px] text-gray-500">Puan</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2 text-center">
                      <BookOpen className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
                      <div className="text-sm font-bold text-gray-800">{student.current_level}</div>
                      <div className="text-[10px] text-gray-500">Seviye</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-2 text-center">
                      <Flame className="w-4 h-4 text-orange-500 mx-auto mb-0.5" />
                      <div className="text-sm font-bold text-gray-800">{student.streak_days}</div>
                      <div className="text-[10px] text-gray-500">Gün Seri</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl p-6 mt-6"
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
