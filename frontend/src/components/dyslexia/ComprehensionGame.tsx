import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, BookOpen, Eye, HelpCircle, Link2, FileText } from 'lucide-react';
import { speak, playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

/**
 * ComprehensionGame – Okuduğunu Anlama Oyunu
 * Orton-Gillingham Aşama 5: Anlama (Comprehension)
 *
 * 5 Strateji: Tahmin et, Sorgula, Görselleştir, Bağla, Özetle
 * Her hikaye kısa tutuluyor. Sorular çoktan seçmeli.
 */

interface Story {
  title: string;
  emoji: string;
  paragraphs: string[];
  questions: ComprehensionQuestion[];
}

interface ComprehensionQuestion {
  strategy: 'predict' | 'question' | 'visualize' | 'connect' | 'summarize';
  strategyEmoji: string;
  strategyLabel: string;
  question: string;
  options: string[];
  correctIndex: number;
}

const STORIES: Story[] = [
  {
    title: 'Küçük Tavşan',
    emoji: '🐰',
    paragraphs: [
      'Küçük tavşan her gün bahçede havuç toplardı.',
      'Bir gün çok büyük bir havuç buldu.',
      'Onu taşıyamadı. Arkadaşı sincap yardım etti.',
      'Birlikte havucu eve taşıdılar ve paylaştılar.',
    ],
    questions: [
      {
        strategy: 'predict',
        strategyEmoji: '🔮',
        strategyLabel: 'Tahmin Et',
        question: 'Tavşan büyük havucu görünce ne yapmış olabilir?',
        options: ['Çok sevinmiştir', 'Ağlamıştır', 'Uyumuştur'],
        correctIndex: 0,
      },
      {
        strategy: 'question',
        strategyEmoji: '❓',
        strategyLabel: 'Sorgula',
        question: 'Tavşana kim yardım etti?',
        options: ['Sincap', 'Kedi', 'Kuş'],
        correctIndex: 0,
      },
      {
        strategy: 'visualize',
        strategyEmoji: '🎨',
        strategyLabel: 'Görselleştir',
        question: 'Hikayede bahçe nasıl bir yer olabilir?',
        options: ['Yeşil ve havuç dolu', 'Karanlık ve boş', 'Kum dolu'],
        correctIndex: 0,
      },
      {
        strategy: 'connect',
        strategyEmoji: '🔗',
        strategyLabel: 'Bağla',
        question: 'Sen de bir arkadaşından yardım aldın mı?',
        options: ['Evet, benzer bir durum yaşadım', 'Hayır, hiç olmadı', 'Hatırlamıyorum'],
        correctIndex: 0,
      },
      {
        strategy: 'summarize',
        strategyEmoji: '📝',
        strategyLabel: 'Özetle',
        question: 'Bu hikaye ne anlatıyor?',
        options: [
          'Arkadaşlar birbirine yardım eder',
          'Tavşan havuç sevmez',
          'Sincap kaçtı',
        ],
        correctIndex: 0,
      },
    ],
  },
  {
    title: 'Yağmurlu Gün',
    emoji: '🌧️',
    paragraphs: [
      'Dışarıda yağmur yağıyordu.',
      'Ali pencerenin önünde oturdu.',
      'Bir gökkuşağı gördü!',
      'Hemen dışarı çıkıp resim çizdi.',
    ],
    questions: [
      {
        strategy: 'predict',
        strategyEmoji: '🔮',
        strategyLabel: 'Tahmin Et',
        question: 'Ali gökkuşağını görünce ne hissetmiştir?',
        options: ['Mutlu olmuştur', 'Korkmuştur', 'Üzülmüştür'],
        correctIndex: 0,
      },
      {
        strategy: 'question',
        strategyEmoji: '❓',
        strategyLabel: 'Sorgula',
        question: 'Ali ne gördü?',
        options: ['Gökkuşağı', 'Kar', 'Yıldız'],
        correctIndex: 0,
      },
      {
        strategy: 'visualize',
        strategyEmoji: '🎨',
        strategyLabel: 'Görselleştir',
        question: 'Gökkuşağı nasıl görünüyor?',
        options: ['Renkli ve yay şeklinde', 'Siyah beyaz', 'Kare şeklinde'],
        correctIndex: 0,
      },
      {
        strategy: 'connect',
        strategyEmoji: '🔗',
        strategyLabel: 'Bağla',
        question: 'Sen hiç gökkuşağı gördün mü?',
        options: ['Evet, çok güzeldi', 'Hayır, görmedim', 'Hatırlamıyorum'],
        correctIndex: 0,
      },
      {
        strategy: 'summarize',
        strategyEmoji: '📝',
        strategyLabel: 'Özetle',
        question: 'Bu hikayenin konusu nedir?',
        options: [
          'Ali yağmurda gökkuşağı görüp resim çizdi',
          'Ali okula gitti',
          'Hava soğuktu',
        ],
        correctIndex: 0,
      },
    ],
  },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function ComprehensionGame({ onComplete }: GameProps) {
  const [story] = useState(() => shuffle(STORIES)[0]);
  const [showStory, setShowStory] = useState(true);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const [startTime] = useState(Date.now());

  const totalQuestions = story.questions.length;
  const currentQ = story.questions[questionIdx];

  const handleReadAloud = () => {
    const fullText = story.paragraphs.join(' ');
    speak(fullText, 0.75);
  };

  const handleStartQuestions = () => {
    setShowStory(false);
  };

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      if (feedback) return;

      const isCorrect = optionIdx === currentQ.correctIndex;

      if (isCorrect) {
        setScore((s) => s + 20);
        setFeedback('correct');
        playSound('success');
        speak('Harika! Doğru yanıt!', 0.9);

        setTimeout(() => {
          setFeedback(null);
          if (questionIdx + 1 >= totalQuestions) {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            const finalScore = score + 20;
            onComplete(Math.min(finalScore, 100), timeSpent);
          } else {
            setQuestionIdx((i) => i + 1);
          }
        }, 1500);
      } else {
        setFeedback('retry');
        playSound('click');
        speak('Tekrar düşün! Hikayeyi hatırla.', 0.9);
        setTimeout(() => setFeedback(null), 1000);
      }
    },
    [feedback, currentQ, questionIdx, totalQuestions, score, startTime, onComplete]
  );

  return (
    <div className="dyslexia-module p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          {showStory ? 'Hikayeyi Oku' : `Soru ${questionIdx + 1} / ${totalQuestions}`}
        </span>
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          ⭐ {score} puan
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Story reading phase */}
        {showStory && (
          <motion.div
            key="story"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 w-full max-w-lg"
          >
            {/* Title */}
            <div className="flex items-center gap-3">
              <span className="text-4xl">{story.emoji}</span>
              <h2 className="text-2xl font-bold">{story.title}</h2>
            </div>

            {/* Story text */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200 w-full">
              {story.paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.3 }}
                  className="text-xl mb-4 last:mb-0"
                  style={{ lineHeight: '2.0' }}
                >
                  {p}
                </motion.p>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={handleReadAloud}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl
                  font-bold hover:bg-blue-600 transition-colors min-h-[60px]"
              >
                <Volume2 className="w-5 h-5" /> Sesli Oku
              </button>
              <button
                onClick={handleStartQuestions}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl
                  font-bold hover:bg-green-600 transition-colors min-h-[60px]"
              >
                <BookOpen className="w-5 h-5" /> Anladım, Sorulara Geç!
              </button>
            </div>
          </motion.div>
        )}

        {/* Question phase */}
        {!showStory && (
          <motion.div
            key={`q-${questionIdx}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col items-center gap-6 w-full max-w-lg"
          >
            {/* Strategy badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full border-2 border-purple-300"
            >
              <span className="text-2xl">{currentQ.strategyEmoji}</span>
              <span className="font-bold text-purple-700">{currentQ.strategyLabel}</span>
            </motion.div>

            {/* Question */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200 w-full">
              <p className="text-xl font-bold text-center" style={{ lineHeight: '1.8' }}>
                {currentQ.question}
              </p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3 w-full">
              {currentQ.options.map((opt, i) => {
                const isCorrectAnswer = feedback === 'correct' && i === currentQ.correctIndex;
                const isRetry = feedback === 'retry';

                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleAnswer(i)}
                    disabled={feedback === 'correct'}
                    className={`
                      w-full text-left px-6 py-4 rounded-xl border-2 text-lg font-bold
                      transition-all min-h-[60px]
                      hover:shadow-md hover:scale-[1.02]
                      focus-visible:outline-4 focus-visible:outline-yellow-400
                      ${isCorrectAnswer ? 'bg-green-100 border-green-400' : ''}
                      ${!feedback ? 'bg-white border-gray-200 hover:border-orange-300' : 'bg-white border-gray-200'}
                    `}
                  >
                    <span className="mr-3">
                      {String.fromCharCode(65 + i)})
                    </span>
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {feedback === 'correct' && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.1 }}
                  exit={{ scale: 0 }}
                  className="text-xl font-bold text-green-600"
                >
                  ✅ Doğru! Harika düşündün!
                </motion.p>
              )}
              {feedback === 'retry' && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-lg font-bold text-yellow-600"
                >
                  🔄 Tekrar düşün! Hikayeyi hatırla.
                </motion.p>
              )}
            </AnimatePresence>

            {/* Back to story button */}
            <button
              onClick={() => setShowStory(true)}
              className="text-sm text-gray-500 hover:text-orange-500 transition-colors font-bold"
            >
              📖 Hikayeye tekrar bak
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
