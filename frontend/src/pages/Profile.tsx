import { motion } from 'framer-motion';
import { User, Mail, BookOpen, Trophy, Star, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useStudentProgress, useAnalytics } from '../hooks/useProgress';
import ProgressBar from '../components/shared/ProgressBar';
import Avatar from '../components/shared/Avatar';
import type { DifficultyType, ProgressRecord, ProgressListResponse, AnalyticsResponse } from '../types';
import { levelFromScore } from '../utils/gamification';
import { DIFFICULTY_THEMES } from '../types';

export default function Profile() {
  const { user, studentProfile, logout } = useAuthStore();
  const { data: progressData } = useStudentProgress(studentProfile?.id);
  const { data: analyticsData } = useAnalytics(studentProfile?.id);
  const difficulty = (studentProfile?.learning_difficulty || 'dyslexia') as DifficultyType;
  const theme = DIFFICULTY_THEMES[difficulty];

  const progressList = (progressData as ProgressListResponse | undefined)?.progress || [];
  const analytics = analyticsData as AnalyticsResponse | undefined;
  const totalScore = analytics?.score_earned || 0;
  const level = levelFromScore(totalScore);
  const completedCount = progressList.filter((p: ProgressRecord) => p.completed).length;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-6 text-center mb-6"
        >
          <Avatar name={user?.name || ''} difficulty={difficulty} size="lg" className="mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-800">{user?.name}</h1>
          <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-1">
            <Mail className="w-4 h-4" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 capitalize">
              {user?.role === 'student' ? 'Öğrenci' : user?.role === 'parent' ? 'Veli' : 'Öğretmen'}
            </span>
          </div>
        </motion.div>

        {/* Student-specific info */}
        {user?.role === 'student' && (
          <>
            {/* Difficulty badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-4 mb-4 ${theme.bg}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{theme.emoji}</span>
                <div>
                  <h3 className="font-bold text-gray-800">{theme.label}</h3>
                  <p className="text-sm text-gray-600">Öğrenme Tipin</p>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-gray-800">{level}</div>
                <div className="text-xs text-gray-500">Seviye</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <Star className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-gray-800">{totalScore}</div>
                <div className="text-xs text-gray-500">Puan</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <BookOpen className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-gray-800">{completedCount}</div>
                <div className="text-xs text-gray-500">Bölüm</div>
              </div>
            </motion.div>

            {/* Progress list */}
            {progressList && progressList.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm p-4 mb-6"
              >
                <h3 className="font-bold text-gray-800 mb-3">Bölüm Puanları</h3>
                <div className="space-y-3">
                  {progressList.map((p: ProgressRecord, i: number) => (
                    <div key={p.id || i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <ProgressBar value={p.score} difficulty={difficulty} size="sm" />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-12 text-right">{p.score}%</span>
                      {p.completed && <span className="text-green-500 text-sm">✓</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Çıkış Yap
        </motion.button>
      </div>
    </div>
  );
}
