import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, Zap, Star, Brain, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChapters } from '../hooks/useChapters';
import { useStudentProgress, useAnalytics } from '../hooks/useProgress';
import ProgressBar from '../components/shared/ProgressBar';
import DyslexiaChapterCard from '../components/dyslexia/DyslexiaChapterCard';
import DysgraphiaChapterCard from '../components/dysgraphia/DysgraphiaChapterCard';
import DyscalculiaChapterCard from '../components/dyscalculia/DyscalculiaChapterCard';
import type { DifficultyType, Chapter, ProgressRecord, ChapterListResponse, ProgressListResponse, AnalyticsResponse } from '../types';
import { levelFromScore, getEncouragement } from '../utils/gamification';
import { getThemeClass } from '../utils/accessibility';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, studentProfile } = useAuthStore();
  const difficulty = (studentProfile?.learning_difficulty || 'dyslexia') as DifficultyType;
  const { data: chaptersData, isLoading: chaptersLoading } = useChapters(difficulty);
  const { data: progressData } = useStudentProgress(studentProfile?.id);
  const { data: analytics } = useAnalytics(studentProfile?.id);

  const chapters = (chaptersData as ChapterListResponse | undefined)?.chapters || [];
  const progressList = (progressData as ProgressListResponse | undefined)?.progress || [];

  const progressMap = useMemo(() => {
    const map = new Map<string, ProgressRecord>();
    progressList.forEach((p: ProgressRecord) => map.set(p.chapter_id, p));
    return map;
  }, [progressList]);

  const totalScore = (analytics as AnalyticsResponse | undefined)?.score_earned || 0;
  const level = levelFromScore(totalScore);
  const completedCount = progressList.filter((p: ProgressRecord) => p.completed).length;
  const totalChapters = chapters.length;
  const overallProgress = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  const themeClass = getThemeClass(difficulty);
  const encouragement = getEncouragement(overallProgress);

  const renderChapterCard = (chapter: Chapter, index: number) => {
    const progress = progressMap.get(chapter.id);
    const onPlay = () => navigate(`/chapters/${chapter.id}/play`);

    switch (difficulty) {
      case 'dyslexia':
        return <DyslexiaChapterCard key={chapter.id} chapter={chapter} progress={progress} onPlay={onPlay} index={index} />;
      case 'dysgraphia':
        return <DysgraphiaChapterCard key={chapter.id} chapter={chapter} progress={progress} onPlay={onPlay} index={index} />;
      case 'dyscalculia':
        return <DyscalculiaChapterCard key={chapter.id} chapter={chapter} progress={progress} onPlay={onPlay} index={index} />;
    }
  };

  const greetingEmoji = difficulty === 'dyslexia' ? '📖' : difficulty === 'dysgraphia' ? '✍️' : '🔢';

  return (
    <div className={`min-h-screen ${themeClass}`}>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-fun font-bold text-gray-800">
            Merhaba, {user?.name?.split(' ')[0]}! {greetingEmoji}
          </h1>
          <p className="text-gray-500 mt-1">{encouragement}</p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{level}</div>
            <div className="text-xs text-gray-500">Seviye</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <Zap className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{totalScore}</div>
            <div className="text-xs text-gray-500">Puan</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <Star className="w-6 h-6 text-purple-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{completedCount}/{totalChapters}</div>
            <div className="text-xs text-gray-500">Bölüm</div>
          </div>
        </motion.div>

        {/* Overall progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">Genel İlerleme</span>
            <span className="text-sm font-bold text-gray-800">{overallProgress}%</span>
          </div>
          <ProgressBar value={overallProgress} difficulty={difficulty} size="md" />
        </motion.div>

        {/* Chapter cards */}
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-800">Bölümler</h2>
        </div>

        {chaptersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-40 shadow-sm" />
            ))}
          </div>
        ) : chapters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chapters.map((chapter: Chapter, index: number) => renderChapterCard(chapter, index))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-2xl shadow-sm"
          >
            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Henüz bölüm eklenmemiş.</p>
            <p className="text-sm text-gray-400 mt-1">Kısa süre içinde harika bölümler gelecek!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
