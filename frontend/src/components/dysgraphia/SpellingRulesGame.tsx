import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, Check, X } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface RuleExercise {
  category: string;
  title: string;
  icon: string;
  questions: Question[];
}

interface Question {
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

const RULE_EXERCISES: RuleExercise[] = [
  {
    category: 'capitalization',
    title: 'Büyük Harf Kuralları',
    icon: '🔠',
    questions: [
      { text: 'Hangisi doğru yazılmıştır?', options: ['ali okula gitti.', 'Ali okula gitti.'], correct: 1, explanation: 'Özel isimler ve cümle başları büyük harfle başlar.' },
      { text: 'Hangisi doğru?', options: ['Ankara\'da yaşıyorum.', 'ankara\'da yaşıyorum.'], correct: 0, explanation: 'Şehir isimleri büyük harfle yazılır.' },
      { text: 'Doğru olan hangisi?', options: ['pazartesi günü', 'Pazartesi günü'], correct: 1, explanation: 'Gün isimleri büyük harfle başlar.' },
    ],
  },
  {
    category: 'ki_de_da',
    title: 'Ki / De / Da Yazımı',
    icon: '📝',
    questions: [
      { text: '"Evde_ki kitabı al." Boşluğa ne gelir?', options: ['evdeki (bitişik)', 'evde ki (ayrı)'], correct: 0, explanation: '-ki sıfat yapıyorsa bitişik yazılır: "evdeki kitap"' },
      { text: '"Sen ___ gel." Boşluğa ne gelir?', options: ['de (ayrı)', 'sende (bitişik)'], correct: 0, explanation: 'De/da bağlacı ayrı yazılır: "Sen de gel."' },
      { text: '"Ali ___ geldi." doğru olan hangisi?', options: ['Ali de geldi.', 'Alide geldi.'], correct: 0, explanation: 'De/da bağlacı her zaman ayrı yazılır.' },
    ],
  },
  {
    category: 'apostrophe',
    title: 'Kesme İşareti',
    icon: '✏️',
    questions: [
      { text: 'Hangisi doğru?', options: ['Atatürk\'ün', 'Atatürkün'], correct: 0, explanation: 'Özel isimlere ek gelince kesme işareti kullanılır.' },
      { text: 'Hangisi doğru?', options: ['kitabın sayfası', 'kitab\'ın sayfası'], correct: 0, explanation: 'Cins isimlere kesme işareti konmaz.' },
    ],
  },
];

export default function SpellingRulesGame({ onComplete }: GameProps) {
  const [ruleIdx, setRuleIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const rule = RULE_EXERCISES[ruleIdx];
  const question = rule.questions[questionIdx];
  const totalQuestions = RULE_EXERCISES.reduce((acc, r) => acc + r.questions.length, 0);
  const completedQuestions = RULE_EXERCISES.slice(0, ruleIdx).reduce((acc, r) => acc + r.questions.length, 0) + questionIdx;

  const handleAnswer = useCallback((optionIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === question.correct;
    if (isCorrect) {
      playSound('correct');
      setScore(prev => prev + Math.round(100 / totalQuestions));
    } else {
      playSound('wrong');
    }
    setShowExplanation(true);
  }, [selectedOption, question, totalQuestions]);

  const handleNext = () => {
    setSelectedOption(null);
    setShowExplanation(false);

    if (questionIdx < rule.questions.length - 1) {
      setQuestionIdx(prev => prev + 1);
    } else if (ruleIdx < RULE_EXERCISES.length - 1) {
      setRuleIdx(prev => prev + 1);
      setQuestionIdx(0);
    } else {
      onComplete(Math.min(100, score));
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Category tabs */}
      <div className="flex justify-center gap-2 mb-4">
        {RULE_EXERCISES.map((r, i) => (
          <div
            key={i}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              i < ruleIdx ? 'bg-green-100 text-green-700' :
              i === ruleIdx ? 'bg-purple-200 text-purple-800' :
              'bg-gray-100 text-gray-400'
            }`}
          >
            <span>{r.icon}</span>
            <span className="hidden sm:inline">{r.title}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-5">
        {/* Question */}
        <div className="text-center mb-6">
          <span className="text-3xl mb-2 block">{rule.icon}</span>
          <h3 className="text-lg font-bold text-purple-800 mb-1">{rule.title}</h3>
          <p className="text-sm text-gray-500">Soru {questionIdx + 1} / {rule.questions.length}</p>
        </div>

        <motion.div
          key={`${ruleIdx}-${questionIdx}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-gray-800 font-medium text-center mb-6 text-lg">{question.text}</p>

          {/* Options */}
          <div className="space-y-3 mb-4">
            {question.options.map((option, i) => {
              const isSelected = selectedOption === i;
              const isCorrect = i === question.correct;
              const showResult = selectedOption !== null;

              return (
                <motion.button
                  key={i}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswer(i)}
                  disabled={selectedOption !== null}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-left transition-all border-2 ${
                    showResult
                      ? isCorrect
                        ? 'bg-green-100 border-green-400 text-green-800'
                        : isSelected
                        ? 'bg-red-100 border-red-400 text-red-800'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                      : 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      showResult && isCorrect ? 'bg-green-500 text-white' :
                      showResult && isSelected ? 'bg-red-500 text-white' :
                      'bg-purple-200 text-purple-700'
                    }`}>
                      {showResult && isCorrect ? <Check className="w-4 h-4" /> :
                       showResult && isSelected ? <X className="w-4 h-4" /> :
                       String.fromCharCode(65 + i)}
                    </div>
                    <span>{option}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4"
              >
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-700">{question.explanation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next button */}
          {selectedOption !== null && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-5 h-5" />
              {ruleIdx === RULE_EXERCISES.length - 1 && questionIdx === rule.questions.length - 1 ? 'Tamamla!' : 'Sonraki'}
            </motion.button>
          )}
        </motion.div>
      </div>

      <div className="text-center mt-3 text-sm text-gray-500">
        Puan: <span className="font-bold text-purple-600">{score}</span>
      </div>
    </div>
  );
}
