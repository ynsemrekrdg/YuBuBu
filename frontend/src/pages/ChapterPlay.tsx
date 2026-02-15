import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lightbulb, CheckCircle, Star, Home, RotateCcw } from 'lucide-react';
import { useChapter } from '../hooks/useChapters';
import { useCompleteChapter } from '../hooks/useProgress';
import { useAIHint } from '../hooks/useAI';
import { useAuthStore } from '../store/useAuthStore';
import ProgressBar from '../components/shared/ProgressBar';
import WordMatchGame from '../components/dyslexia/WordMatchGame';
import LetterTracingGame from '../components/dyslexia/LetterTracingGame';
import LetterFormingGame from '../components/dysgraphia/LetterFormingGame';
import HandwritingPracticeGame from '../components/dysgraphia/HandwritingPracticeGame';
import NumberLineGame from '../components/dyscalculia/NumberLineGame';
import CountingGame from '../components/dyscalculia/CountingGame';
import ConcreteCountingGame from '../components/dyscalculia/ConcreteCountingGame';
import NumberComparisonGame from '../components/dyscalculia/NumberComparisonGame';
import PlaceValueBlocksGame from '../components/dyscalculia/PlaceValueBlocksGame';
import AdditionCRAGame from '../components/dyscalculia/AdditionCRAGame';
import SubtractionCRAGame from '../components/dyscalculia/SubtractionCRAGame';
import WordProblemGame from '../components/dyscalculia/WordProblemGame';
import type { DifficultyType, ContentConfig } from '../types';
import { getStars, getEncouragement } from '../utils/gamification';
import { playSound } from '../utils/accessibility';

export default function ChapterPlay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { studentProfile } = useAuthStore();
  const difficulty = (studentProfile?.learning_difficulty || 'dyslexia') as DifficultyType;
  const { data: chapter, isLoading } = useChapter(id || '');
  const completeMutation = useCompleteChapter();
  const hintMutation = useAIHint(id || '');

  const [gameIndex, setGameIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [hintText, setHintText] = useState('');
  const [showHint, setShowHint] = useState(false);

  const games = getGamesForDifficulty(difficulty, chapter?.content_config);
  const totalGames = games.length;
  const gameProgress = totalGames > 0 ? Math.round(((gameIndex + (finished ? 1 : 0)) / totalGames) * 100) : 0;
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const stars = getStars(avgScore);

  const handleGameComplete = useCallback((score: number) => {
    setScores((prev) => [...prev, score]);
    if (gameIndex + 1 < totalGames) {
      setTimeout(() => setGameIndex((prev) => prev + 1), 500);
    } else {
      setFinished(true);
      playSound('success');
      if (id && studentProfile?.id) {
        const finalScore = Math.round(([...scores, score].reduce((a, b) => a + b, 0)) / ([...scores, score].length));
        completeMutation.mutate({ chapter_id: id, student_id: studentProfile.id, score: finalScore, time_spent_seconds: 0 });
      }
    }
  }, [gameIndex, totalGames, id, scores, completeMutation, studentProfile]);

  const handleHint = async () => {
    if (!id) return;
    try {
      const res = await hintMutation.mutateAsync(1);
      setHintText(res.hint);
      setShowHint(true);
    } catch {
      setHintText('Bir ipucu bulunamadı, tekrar dene!');
      setShowHint(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-10 h-10 border-4 border-gray-200 border-t-yub-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Geri">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-800 truncate text-sm">{chapter?.title}</h1>
          <ProgressBar value={gameProgress} difficulty={difficulty} size="sm" className="mt-1" />
        </div>
        <button
          onClick={handleHint}
          disabled={hintMutation.isPending}
          className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-xl transition-colors"
          aria-label="İpucu al"
        >
          <Lightbulb className="w-5 h-5 text-yellow-600" />
        </button>
        <span className="text-sm font-bold text-gray-500">{gameIndex + 1}/{totalGames}</span>
      </div>

      {/* Hint overlay */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 relative"
          >
            <button onClick={() => setShowHint(false)} className="absolute top-2 right-2 text-yellow-600 text-sm font-bold">✕</button>
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-800">{hintText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game area */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!finished ? (
            <motion.div key={gameIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              {renderGame(games[gameIndex], difficulty, handleGameComplete)}
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-fun font-bold text-gray-800 mb-2">Tebrikler!</h2>
              <p className="text-gray-500 mb-4">{chapter?.title} bölümünü tamamladın!</p>

              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3].map((s) => (
                  <motion.div
                    key={s}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: s * 0.2 }}
                  >
                    <Star className={`w-10 h-10 ${s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  </motion.div>
                ))}
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-6">{avgScore} Puan</p>
              <p className="text-gray-500 mb-8">{getEncouragement(avgScore)}</p>

              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-6 py-3 bg-yub-primary text-white rounded-xl font-bold shadow-lg"
                >
                  <Home className="w-5 h-5" /> Ana Sayfa
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setGameIndex(0);
                    setScores([]);
                    setFinished(false);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold"
                >
                  <RotateCcw className="w-5 h-5" /> Tekrar
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type GameType = 'wordMatch' | 'letterTracing' | 'letterForming' | 'handwriting' | 'numberLine' | 'counting' | 'concreteCount' | 'numberComparison' | 'placeValue' | 'additionCRA' | 'subtractionCRA' | 'wordProblem';

function getGamesForDifficulty(difficulty: DifficultyType, contentConfig?: ContentConfig): GameType[] {
  switch (difficulty) {
    case 'dyslexia': return ['wordMatch', 'letterTracing'];
    case 'dysgraphia': return ['letterForming', 'handwriting'];
    case 'dyscalculia': {
      // Use chapter-specific games from content_config if available
      const configGames = contentConfig?.activity?.games as string[] | undefined;
      if (configGames && configGames.length > 0) {
        const validGames: GameType[] = configGames.filter(
          (g): g is GameType => ['numberLine', 'counting', 'concreteCount', 'numberComparison', 'placeValue', 'additionCRA', 'subtractionCRA', 'wordProblem'].includes(g)
        );
        if (validGames.length > 0) return validGames;
      }
      return ['concreteCount', 'numberComparison'];
    }
  }
}

function renderGame(game: GameType, difficulty: DifficultyType, onComplete: (score: number) => void): JSX.Element {
  const props = { onComplete, difficulty };
  switch (game) {
    case 'wordMatch': return <WordMatchGame {...props} />;
    case 'letterTracing': return <LetterTracingGame {...props} />;
    case 'letterForming': return <LetterFormingGame {...props} />;
    case 'handwriting': return <HandwritingPracticeGame {...props} />;
    case 'numberLine': return <NumberLineGame {...props} />;
    case 'counting': return <CountingGame {...props} />;
    case 'concreteCount': return <ConcreteCountingGame {...props} />;
    case 'numberComparison': return <NumberComparisonGame {...props} />;
    case 'placeValue': return <PlaceValueBlocksGame {...props} />;
    case 'additionCRA': return <AdditionCRAGame {...props} />;
    case 'subtractionCRA': return <SubtractionCRAGame {...props} />;
    case 'wordProblem': return <WordProblemGame {...props} />;
  }
}
